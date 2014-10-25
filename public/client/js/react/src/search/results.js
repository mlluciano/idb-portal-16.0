/**
 * @jsx React.DOM
 */

var React = require('react');
var _ = require('lodash');

module.exports = React.createClass({
    getInitialState: function(){
        return {view: 'list'};
    },
    viewChange: function(event){
        this.setState({view: event.currentTarget.attributes['data-value'].value})
    },
    render: function(){
        var search = this.props.search,self=this;
        var li=[];

        ['list','labels','images'].forEach(function(item){
            var cl = item == self.state.view ? 'active' : ''; 
            li.push(
                <li onClick={self.viewChange} data-value={item} className={cl}>{item}</li>
            )
        })        
        return(
            <div id="results" className="clearfix">
                <ul id="results-menu">
                    {li}
                </ul>
                <ResultsPanel search={search} view={this.state.view} />
            </div>
        )
    }
});


var ResultsPanel = React.createClass({
    getResults: function(searchObj){
        var query = queryBuilder.makeQuery(searchObj), self=this;
        searchServer.esQuery('records',query,function(results){
            self.setState({results: results.hits.hits},function(){
                self.forceUpdate();
            });
        });
    },
    getInitialState: function(){
        this.getResults(this.props.search);
        return {results: []};
    },
    shouldComponentUpdate: function(nextProps, nextState){
        return false;
    },
    componentWillReceiveProps: function(nextProps){
        this.getResults(nextProps.search);
    },
    render: function(){
        switch(this.props.view){
            case 'list':
                return <ResultsList results={this.state.results} />;
            case 'labels':
                return <ResultsLabels results={this.state.results} />;
            case 'images':
                return <ResultsImages results={this.state.results} />;
        }

    }
})

var ResultsList = React.createClass({
    render: function(){
        var columns = ['scientificname','genus','collectioncode','specificepithet','commonname'];
        var rows=[];
        var headers=[];
        columns.forEach(function(item){
            var style={width: (Math.floor(100/columns.length))+'%'}
            headers.push(
                <th style={style}>{fields.byTerm[item].name}</th>
            )
        })
        this.props.results.forEach(function(item){
            var tds = [];
            columns.forEach(function(name){
                var val = helpers.check(item._source.data['idigbio:data'][fields.byTerm[name].dataterm]);
                tds.push(<td>{val}</td>);
            })
            rows.push(
                <tr>
                    {tds}
                </tr>
            );
        })
       
        return(
            <div className="panel">
                <table className="table table-condensed">
                    <thead>
                        <tr>{headers}</tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        )
    }
});

var ResultsLabels = React.createClass({
    makeLabel: function(result){
        var data = result._source, raw = data.data['idigbio:data'];
        var txt = '';
        var content=[];
        if(typeof data.scientificname == 'string') { 
            txt += helpers.check(raw["dwc:scientificName"]) + helpers.check(raw["dwc:scientificNameAuthorship"]);
            content.push(
                <em>
                    <b>
                      {helpers.check(raw["dwc:scientificName"])}
                    </b>
                </em>          
            );
            content.push(
                <span>{ helpers.check(raw["dwc:scientificNameAuthorship"], ' ') }</span> 
            );
         
        } else {  
            //txt += helpers.check(raw["dwc:genus"]) + helpers.check(raw["dwc:specificEpithet"]) + helpers.check(raw["dwc:scientificNameAuthorship"]);
            content.push(
                <em>
                   <b>
                {helpers.check(raw["dwc:genus"]) + helpers.check(raw["dwc:specificEpithet"],' ') }
                   </b>
                </em>
            )
            content.push(
               <span>{helpers.check(raw["dwc:scientificNameAuthorship"], ' ')}</span>
            )

        } 

        /*
        if( data.hasImage ){ 
            <span class="label-image-holder">
               if(data.mediarecords.length > 1){ %>
                    <span class="label-image-count">
                        <%= data.mediarecords.length %>
                    </span>
               } 
            <img onerror="$(this).attr('src','/portal/img/notavailable.png')" onload="$(this).attr('alt','image thumbnail')" class="pull-right label-image img-rounded" alt=" loading image..." src="https://api.idigbio.org/v1/records/<%= data.uuid %>/media?quality=thumbnail" > 
            </span>       
         } 
        var terms = ['kingdom','phylum','class','order','family','country', 'stateprovince','locality','collector','fieldnumber','datecollected','institutioncode','collectioncode'];

        var para = []
        _.each(terms,function(term){
            if(helpers.check(raw[fields.byTerm[term].dataterm]) !== ''){
                if(term === 'datecollected'){
                    para.push(raw[fields.byTerm[term].dataterm].substring(0,10));
                }else{
                    para.push(raw[fields.byTerm[term].dataterm])
                }
            }
        })
        var clean = para.filter(function(i){
            return !_.isEmpty(i);
        });
        var out = clean.join(', ');
        if ((txt+out).length > 255) {
            out = out.substring(0, out.length-txt.length);// + ' ...';
        }
        */
        return (
            <div className="pull-left result-item result-label" title="click to view record">
                <p>
                    <span style={{lineHeight: '1em', fontSize:'1em'}}>
                        {content}
                    </span>     
                </p>
            </div>
        )
    },
    render: function(){
        var labels = [],self=this;
        this.props.results.forEach(function(result){
            labels.push(self.makeLabel(result));
        })
        return (
            <div className="panel">
                {labels}
            </div>
        )
    }
});

var ResultsImages = React.createClass({
    render: function(){
        return false
    }
})