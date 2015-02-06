
var React = require('react')

var searchBase = "//" + window.searchServer["host"] + "/idigbio/";
var statsBase = "//" + window.searchServer["host"] + "/stats/";

var apiBase = "//api.idigbio.org/v1/"

var total_index_mediarecord_count = 0;
var total_index_record_count = 0;
var total_rsindex_mediarecord_count = 0;
var total_rsindex_record_count = 0;
var total_api_record_count = 0;
var total_api_mediarecord_count = 0;
var total_digest_record_count = 0;
var total_digest_mediarecord_count = 0;


var pending_calls = 0;

var allquery = {
  "query": {
    "match_all": {}
  },
  "from": 0,
  "size": 1000,
  "sort": [],
  "facets": {
  }  
}

var facetquery = {
  "query": {
    "match_all": {}
  },
  "from": 0,
  "size": 1,
  "sort": [],
  "aggs": {
    "rsfacet": {
      "terms": {
        "field": "recordset",
        "size": 1000
      }
    }
  }
}

var statsquery = {
  "query": {
    "match_all": {}
  },
  "size": 0,
  "aggs": {
    "rs": {
      "terms": {
        "field": "recordset_id",
        "size": 1000
      },
      "aggs": {
        "dm": {
          "date_histogram": {
            "field": "harvest_date",
            "interval": "day",
            "format": "yyyy-MM-dd",
            "order": {
              "_key": "desc"
            }
          },
          "aggs": {
            "rc": {
              "max": {
                "field": "records_count"
              }
            },
            "mrc": {
              "max": {
                "field": "mediarecords_count"
              }
            }
          }
        },
        "recent": {
          "date_range": {
            "field": "harvest_date",
            "ranges": [
              {
                "from": "now-1h"
              }
            ]
          },
          "aggs": {
            "rc": {
              "max": {
                "field": "records_count"
              }
            },
            "mrc": {
              "max": {
                "field": "mediarecords_count"
              }
            }
          }
        }
      }
    }
  }
}

function formatNum (num){
  return num.toString().replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function scrollToId(id){
      $('html,body').animate({scrollTop: $("#"+id).offset().top},'slow');
}
function getApiCount(uuid,type) {
  pending_calls += 1
  $.get(apiBase + "recordsets/" + uuid + "/" + type + "?limit=1", function(data,textStatus,jqXHR){
    count = parseInt(data["idigbio:itemCount"]);
    if (recordsets[uuid]) {
      if (type == "records") {
        total_api_record_count += count;
        recordsets[uuid].api_record_count = count;
      } else if (type == "mediarecords") {
        total_api_mediarecord_count += count;
        recordsets[uuid].api_mediarecord_count = count;
      }
    } else {
      if (type == "records") {
        total_api_record_count += count;
        recordsets[uuid] = {
          api_record_count: count
        }
      } else if (type == "mediarecords") {
        total_api_mediarecord_count += count;
        recordsets[uuid] = {
          api_mediarecord_count: count
        }
      }
    } 
    pending_calls -= 1;         
  })
}

var publishers = {}
var recordsets = {}

pending_calls += 1;
$.post(searchBase + "publishers/_search",JSON.stringify(allquery),function(data,textStatus,jqXHR){
  
  _.each(data.hits.hits,function(hit){
    var name = hit._source.data["idigbio:data"].name;
    if(name == ""){
      name = hit._source.data["idigbio:data"].base_url;
    }          
    if (publishers[hit._source.uuid]) {
      publishers[hit._source.uuid].name = name;
    } else {
      publishers[hit._source.uuid] = {
        name: name
      }
    }
  });
  pending_calls -= 1;
});

pending_calls += 1;
$.post(searchBase + "recordsets/_search",JSON.stringify(allquery),function(data,textStatus,jqXHR){
  _.each(data.hits.hits,function(hit){
    // getApiCount(hit._source.uuid,"records");
    // getApiCount(hit._source.uuid,"mediarecords");
    var name = hit._source.data["idigbio:data"].collection_name;
    if(name == ""){
      name = hit._source.data["idigbio:uuid"];
    }          
    if (recordsets[hit._source.uuid]) {
      recordsets[hit._source.uuid].name = name;
    } else {
      recordsets[hit._source.uuid] = {
        name: name
      }
    }

    if(hit._source.publisher) {
      if (publishers[hit._source.publisher]) {
        if (publishers[hit._source.publisher].recordsets) {
          publishers[hit._source.publisher].recordsets.push(hit._source.uuid)
        } else {
          publishers[hit._source.publisher].recordsets = [hit._source.uuid]
        }
      } else {
        publishers[hit._source.publisher] = {
          recordsets: [hit._source.uuid]
        }
      }
    }
  });
  pending_calls -= 1;        
});

pending_calls += 1;
$.post(statsBase + "api/_search",JSON.stringify(statsquery),function(data,textStatus,jqXHR){
  _.each(data.aggregations.rs.buckets,function(b){
    if (recordsets[b.key]) {
      recordsets[b.key].api_record_count = b.recent.buckets[0].rc.value;
      recordsets[b.key].api_mediarecord_count = b.recent.buckets[0].mrc.value;
    } else {
      recordsets[b.key] = {
        api_record_count: b.dm.buckets[0].rc.value,
        api_mediarecord_count: b.dm.buckets[0].mrc.value
      }
    }          
  })

  pending_calls -= 1;
});

pending_calls += 1;
$.post(statsBase + "digest/_search",JSON.stringify(statsquery),function(data,textStatus,jqXHR){
  _.each(data.aggregations.rs.buckets,function(b){
    if (recordsets[b.key]) {
      recordsets[b.key].digest_record_count = b.dm.buckets[0].rc.value;
      recordsets[b.key].digest_mediarecord_count = b.dm.buckets[0].mrc.value;
    } else {
      recordsets[b.key] = {
        digest_record_count: b.dm.buckets[0].rc.value,
        digest_mediarecord_count: b.dm.buckets[0].mrc.value
      }
    }          
  })

  pending_calls -= 1;
});

pending_calls += 1;
$.post(searchBase + "records/_search",JSON.stringify(facetquery),function(data,textStatus,jqXHR){
  total_index_record_count = data.hits.total;
  _.each(data.aggregations.rsfacet.buckets,function(b){
    if (recordsets[b.key]) {
      recordsets[b.key].index_record_count = b.doc_count;
    } else {
      recordsets[b.key] = {
        index_record_count: b.doc_count
      }
    }          
  })
  pending_calls -= 1;
});

pending_calls += 1;
$.post(searchBase + "mediarecords/_search",JSON.stringify(facetquery),function(data,textStatus,jqXHR){
  total_index_mediarecord_count = data.hits.total;
  _.each(data.aggregations.rsfacet.buckets,function(b){
    if (recordsets[b.key]) {
      recordsets[b.key].index_mediarecord_count = b.doc_count;
    } else {
      recordsets[b.key] = {
        index_mediarecord_count: b.doc_count
      }
    }          
  })
  pending_calls -= 1;
}); 

var count_types = ["digest","api","index"];
var rec_types = ["record","mediarecord"];

function hasCounts(o){
  var r = false;  
  count_types.forEach(function(ct){
    rec_types.forEach(function(rt){      
      r = r || ((ct+"_"+rt+"_count" in o) && (o[ct+"_"+rt+"_count"] !== 0 && o[ct+"_"+rt+"_count"] !== "0"));
    })
  })
  return r
}

function getCounts(o){
  var r = {}
  count_types.forEach(function(ct){
    rec_types.forEach(function(rt){
      r[ct+"_"+rt+"_count"] = o[ct+"_"+rt+"_count"]||0;
    })
  })
  return r
}

  var Recordset = React.createClass({
    render: function() {      
      if (hasCounts(this.props)) {
        var cts = getCounts(this.props);
        /*var tds = _.map(cts,function(ct,key){
          return <td>{ct}</td>
        })*/

        return (
          <tr>
            <td>
              <a href={"/portal/recordsets/" + this.props.key }>{this.props.name}</a>
            </td>
            <td className="valcol">{formatNum(cts.digest_record_count)}</td>
            <td className="valcol">{formatNum(cts.api_record_count)}</td>
            <td className="valcol">{formatNum(cts.index_record_count)}</td>
            <td className="valcol">{formatNum(cts.digest_mediarecord_count)}</td>
            <td className="valcol">{formatNum(cts.api_mediarecord_count)}</td>
            <td className="valcol">{formatNum(cts.index_mediarecord_count)}</td>
          </tr>
        );
      } else {
        var style = {"display": "none"}
        return (
          <tr style={style}>
            {/* this.props.key SKIPPED */}
          </tr>
        );
      }
    }        
  });

  var Publisher = React.createClass({
    render: function() {
      var totals = {}
      count_types.forEach(function(ct){
        rec_types.forEach(function(rt){
          totals[ct+"_"+rt+"_count"] = 0;
        })
      })      
      var recsets = _.map(this.props.recordsets, function(reckey){
        var cts = getCounts(recordsets[reckey]);
        _.each(cts,function(ct,key){
          totals[key] += ct;
        })
        return <Recordset name={recordsets[reckey].name} key={reckey} index_record_count={cts.index_record_count} index_mediarecord_count={cts.index_mediarecord_count} api_record_count={cts.api_record_count} api_mediarecord_count={cts.api_mediarecord_count} digest_record_count={cts.digest_record_count} digest_mediarecord_count={cts.digest_mediarecord_count} />
      });
      var tds = _.map(totals,function(ct,key){
        return <td>{ct}</td>
      })
      return (
        <div>
          <h4 id={this.props.key} >{this.props.name}</h4>          
          <table className="table table-bordered datatable table-condensed tablesorter-blue" id={this.props.key+'_table'}>
              <thead>
                  <tr>
                      <th></th>
                      <th colSpan="3" className="top-header">Record Count</th>
                      <th colSpan="3" className="top-header">Media Record Count</th>
                  </tr>
                  <tr>
                      <th className="namecol">Dataset Name</th>
                      <th className="statcol">Digest</th>
                      <th className="statcol">API</th>                          
                      <th className="statcol">Index</th>
                      <th className="statcol">Digest</th>                          
                      <th className="statcol">API</th>
                      <th className="statcol">Index</th>
                  </tr>
              </thead>
              <tbody>
                  {recsets}
              </tbody>
          </table>
        </div>
      );
    }        
  });

  var PubSummaryRow = React.createClass({
    clickScroll: function(event) {
        scrollToId(this.props.key)
        return false
    },
    render: function(){
      var totals = {}
      count_types.forEach(function(ct){
        rec_types.forEach(function(rt){
          totals[ct+"_"+rt+"_count"] = 0;
        })
      })      
      _.each(this.props.recordsets, function(reckey){
        var cts = getCounts(recordsets[reckey]);
        _.each(cts,function(ct,key){
          totals[key] += ct;
        })  
      });   
      var tds = _.map(totals,function(ct,key){
        return <td>{ct}</td>
      })       
      return (
        <tr>
            <td><a href={"#"} onClick={this.clickScroll}>{this.props.name}</a></td>
            <td className="valcol">{formatNum(totals.digest_record_count)}</td>
            <td className="valcol">{formatNum(totals.api_record_count)}</td>
            <td className="valcol">{formatNum(totals.index_record_count)}</td>
            <td className="valcol">{formatNum(totals.digest_mediarecord_count)}</td>
            <td className="valcol">{formatNum(totals.api_mediarecord_count)}</td>
            <td className="valcol">{formatNum(totals.index_mediarecord_count)}</td>
        </tr>
      );      
    }
  });

  var PubSummary = React.createClass({
     render: function() {
      var pubs = _.map(_.keys(publishers), function(pubkey){
        return <PubSummaryRow name={publishers[pubkey].name} key={pubkey} recordsets={publishers[pubkey].recordsets} />
      });
      return (
        <div>
            <h4>Publisher Summary</h4>
            <table className="table table-bordered datatable table-condensed tablesorter-blue" id="publishers-table" >
              <thead>
                  <tr>
                      <th></th>
                      <th colSpan="3" className="top-header">Record Count</th>
                      <th colSpan="3" className="top-header">Media Record Count</th>
                  </tr>
                  <tr>
                      <th>Publisher Name</th>
                      <th className="statcol">Digest</th>
                      <th className="statcol">API</th>                          
                      <th className="statcol">Index</th>
                      <th className="statcol">Digest</th>                          
                      <th className="statcol">API</th>
                      <th className="statcol">Index</th>
                  </tr>
              </thead>
              <tbody>
                {pubs}
              </tbody>
            </table>
        </div>
      );
    }
  });

  var StatsTable = React.createClass({
    render: function(){        
        return (
            <div>
                <table className="table table-bordered table-condensed" id="statstable">
                    <tr>
                        <th>&nbsp;</th>
                        <th className="statcol">Record Count</th>
                        <th className="statcol">Media Record Count</th>
                    </tr>
                    <tr>
                        <td>Total from Providers</td>
                        <td className="valcol">{formatNum(this.props.total_digest_record_count)}</td>
                        <td className="valcol">{formatNum(this.props.total_digest_mediarecord_count)}</td>
                    </tr>    
                    <tr>
                        <td>Total in API</td>
                        <td className="valcol">{formatNum(this.props.total_api_record_count)}</td>
                        <td className="valcol">{formatNum(this.props.total_api_mediarecord_count)}</td>
                    </tr>    
                    <tr>
                        <td>Total Published (all data incorporated in new workflow)</td>
                        <td className="valcol">{formatNum(this.props.total_rsindex_record_count)}</td>
                        <td className="valcol">{formatNum(this.props.total_rsindex_mediarecord_count)}</td>
                    </tr>                            
                    <tr>
                        <td>Total Indexed (all data) *</td>
                        <td className="valcol">{formatNum(this.props.total_index_record_count)}</td>
                        <td className="valcol">{formatNum(this.props.total_index_mediarecord_count)}</td>
                    </tr>    
                </table>
                <p>* Data that is marked deleted in iDigBio remains indexed until a cleanup is run.</p>
            </div>
        )
    }
  })

  var Page = React.createClass({   
    render: function() {
      total_rsindex_record_count = 0;
      total_rsindex_mediarecord_count = 0;
      _.each(_.keys(publishers),function(pubkey){
        _.each(publishers[pubkey].recordsets,function(rskey){
            total_rsindex_record_count += recordsets[rskey].index_record_count||0;
            total_rsindex_mediarecord_count += recordsets[rskey].index_mediarecord_count||0;
        })
      })

      total_digest_record_count = 0;
      total_digest_mediarecord_count = 0;
      _.each(_.keys(publishers),function(pubkey){
        _.each(publishers[pubkey].recordsets,function(rskey){
            total_digest_record_count += recordsets[rskey].digest_record_count||0;
            total_digest_mediarecord_count += recordsets[rskey].digest_mediarecord_count||0;
        })
      })

      total_api_record_count = 0;
      total_api_mediarecord_count = 0;
      _.each(_.keys(publishers),function(pubkey){
        _.each(publishers[pubkey].recordsets,function(rskey){
            total_api_record_count += recordsets[rskey].api_record_count||0;
            total_api_mediarecord_count += recordsets[rskey].api_mediarecord_count||0;
        })
      })      

      var pubs = _.map(_.keys(publishers), function(pubkey){
        return <Publisher name={publishers[pubkey].name} key={pubkey} recordsets={publishers[pubkey].recordsets} />
      });
      return (
        <div>
          <StatsTable total_index_record_count={total_index_record_count} total_index_mediarecord_count={total_index_mediarecord_count} total_api_record_count={total_api_record_count} total_api_mediarecord_count={total_api_mediarecord_count} total_rsindex_record_count={total_rsindex_record_count} total_rsindex_mediarecord_count={total_rsindex_mediarecord_count} total_digest_record_count={total_digest_record_count} total_digest_mediarecord_count={total_digest_mediarecord_count}/>
          <PubSummary />
          {pubs}
        </div>
      );
    }
  });


  function page_render() {
    console.log(pending_calls)
    if (pending_calls > 0) {     
        requestAnimationFrame(page_render);
    } 
    React.renderComponent(
      <Page/>,
      document.getElementById('main')
    );  

    if(pending_calls===0){
      _.keys(publishers).forEach(function(uuid){
          $('#'+uuid+'_table').tablesorter()
      })
      $('#publishers-table').tablesorter();
    }
  }
  requestAnimationFrame(page_render)