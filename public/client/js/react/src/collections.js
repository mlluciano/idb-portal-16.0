
var React = require('react');
var Griddle = require('griddle-react');
var helpers = require('../../lib/helpers');

var openMapPopup;
module.exports = React.createClass({
    render: function(){
        openMapPopup=this.props.openMapPopup;
        var columnMeta=[{
                "columnName": "collection_url",
                "locked": false,
                "visible": true,
                "cssClassName":"link-cell",
                "customComponent": LinkCell,
                "displayName": "Institution URL"
            },
            {
                "columnName": "collection_catalog_url",
                "cssClassName":"link-cell",
                "locked": false,
                "visible": true,
                "customComponent": LinkCell,
                "displayName": "Catalog URL"
                
            },
            {
                "columnName": "institution",
                "locked": false,
                "visible": true,
                "customComponent": LinkName,
                "displayName": "Institution"
                
            },
            {
                "columnName": "contact_email",
                "locked": false,
                "visible": true,
                "customComponent": Email,
                "displayName": "Contact Email"
                
            },
            {
                "columnName": "recordsets",
                "locked": false,
                "visible": true,
                "customComponent": Recordsets,
                "displayName": "Recordsets"
                
            },
            {
                "columnName": "update_url",
                "locked": false,
                "visible": true,
                "customComponent": UpdateLink,
                "displayName": "Update/Add Information"
                
            },
            {
                "columnName": "collection_uuid",
                "locked":false,
                "visibile":true,
                "customComponent": MapLink,
                "displayName": "Show On Map"
            }
        ]
        var i;
        var cols = _.map(_.without(_.keys(this.props.data[0]),_.map(columnMeta,function(i){return i.columnName})),function(item){
            var frags = item.split('_');
            for (i=0; i<frags.length; i++) {
                frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
            }
            return {"columnName": item, "displayName": frags.join(' ')}
        });

        return (
            <Griddle 
                showSettings={true} 
                results={this.props.data} 
                showFilter={true} 
                resultsPerPage={20}
                initialSort={'institution'}
                columns={['institution','collection',
                'contact','contact_role', 'update_url', 'collection_uuid', 'recordsets']}  
                columnMetadata={columnMeta.concat(cols)}
                enableInfiniteScroll={true} bodyHeight={400} 
                useFixedHeader={true} />
        )
    }
});

var LinkCell = React.createClass({
    render: function(){
        var d = this.props.data;
        if(_.isEmpty(d) || d.toLowerCase() == 'na'){
            return <span/>
        }else{
            var l;
            if(d.match('http')==null){
                l='http://'+d;
            }else{
                l=d;
            }
            return (
                <a href={l} target="_new">Link</a>
            )            
        }
    }
});

var LinkName = React.createClass({
    render: function(){
        var d = this.props.data;
        if(d == null || d.toLowerCase() == 'na' ){
            return <span/>
        }else{
            var href = '/portal/collections/'+this.props.rowData.collection_uuid.split('urn:uuid:')[1];
            return (
                <a href={href} target={"_collection_"+this.props.rowData.collection_uuid}>{d}</a>
            )            
        }
    }
});

var Email = React.createClass({
    render: function(){
        var d = this.props.data;
        
        if(helpers.testEmail(d)){
            return <a href={'mailto:'+d}>{d}</a>
        }else{
            return <span/>
        }
    }
});

var Recordsets = React.createClass({
    render: function(){
        var d = this.props.data;
        
        if(_.isString(d) && !_.isEmpty(d)){
            var records = d.split(/,/);
            var links=[];

            records.forEach(function(item){
                if(item.trim().length > 0){
                    /*links.push(
                        <a href={'/portal/recordsets/'+item.trim()} key={item}>{item}</a>
                    )*/
                    links.push('"'+item.trim()+'"');
                }
            })
            return <span>
                    <a href={'/portal/search?rq={"recordset":['+links.join(',')+']}'}>Search Recordset(s)</a>
                    </span>
        }else{
            return <span/>
        }
    }
});

var UpdateLink = React.createClass({
    /*  This process creates a url to a google doc. 
        Encoded in the url is the information from the current record, prepopulating the form with existing data.
        This enables the new entry to appear as an update to the end user.*/
    render: function(){
        var d=this.props.rowData;

        var url = 'https://docs.google.com/forms/d/1slWOvxuLpuPdvDihSibLQq9BPsOqPzK8Hh93zCW3dRI/viewform?';
        url += GoogleFormQS(326174790, d.institution);
        url += GoogleFormQS(2031121141, d.collection);
        url += GoogleFormQS(4068754, d.institution_code);
        url += GoogleFormQS(1582913154, d.collection_code);
        url += GoogleFormQS(1336841557, d.collection_url);
        url += GoogleFormQS(103879345, d.collection_catalog_url );
        url += GoogleFormQS(107456176, d.geographic_range );
        url += GoogleFormQS(879476273, d.taxonomic_coverage );
        url += GoogleFormQS(417603227, d.collection_size );
        url += GoogleFormQS(1321049572, d.contact );
        url += GoogleFormQS(1687847097, d.contact_role );
        url += GoogleFormQS(1086198428, d.contact_email );
        url += GoogleFormQS(246950189, d.mailing_address );
        url += GoogleFormQS(1584255348, d.mailing_city );
        url += GoogleFormQS(1966582743, d.mailing_state );
        url += GoogleFormQS(256217142, d.mailing_zip );
        url += GoogleFormQS(447546773, d.physical_address );
        url += GoogleFormQS(1565624766, d.physical_city );
        url += GoogleFormQS(1920508789, d.physical_state );
        url += GoogleFormQS(1022645685, d.physical_zip );
        url += GoogleFormQS(764919322, d.collection_uuid );
        url += GoogleFormQS(1499949381, d.recordsets );

        return <a href={url} target="_new">Update/Add Information</a>
    }
});

var MapLink = React.createClass({
    openClick: function(e){
        e.preventDefault()
        openMapPopup(e.target.attributes.href.value);
    },
    render: function(){
        var d=this.props.data;
       
        if(_.isNull(this.props.rowData.lat) || _.isNull(this.props.rowData.lon)){
            return <span/>
        }else{
            return <a href={d} target="_new" onClick={this.openClick} >Show On Map</a>
        }
    }
});

function GoogleFormQS(entryID, querypart) {
    var result;
    var encodedComponent = encodeURIComponent(querypart);

    result = encodedComponent === 'undefined' || encodedComponent === '' || encodedComponent === 'null' ? '' : '&entry.' + entryID + '=' + encodedComponent;

    return result;
};