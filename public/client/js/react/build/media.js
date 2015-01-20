/**
 * @jsx React.DOM
 */

var React = require('react');
var dwc = require('../../lib/dwc_fields');
var _ = require('lodash');

var Media = React.createClass({displayName: 'Media',
    error: function(event){
        $(event.currentTarget).attr('src','/portal/img/missing.svg');
    },
    render: function(){
        var link='';
        if(_.has(this.props.data,'ac:accessURI')){
            link = this.props.data['ac:accessURI'];
        }else if(_.has(this.props.data,'ac:bestQualityAccessURI')){
            link = this.props.data['ac:bestQualityAccessURI'];
        }

        return (
            React.DOM.div({key: this.props.key, id: "media-wrapper", className: "clearfix"}, 
                React.DOM.a({className: "clearfix", target: '_'+this.props.key, href: link, title: "click to open original media file"}, 
                    React.DOM.img({className: "media", src: '//api.idigbio.org/v1/mediarecords/'+this.props.key+'/media?quality=webview', onError: this.error})
                ), 
                React.DOM.a({href: link, download: this.props.key, target: '_'+this.props.key}, 
                    "Download Media File"
                )
            )
        );
    }
});

var Buttons = React.createClass({displayName: 'Buttons',
    render: function(){
        var el=[];
        if(_.has(this.props.data,'records')){
            var link = '/portal/records/'+this.props.data.records[0];
            el.push(
                React.DOM.a({className: "btn button", href: link, key: link}, 
                    "Go To Specimen Record"
                )
            )
        }else{
            el.push(
                React.DOM.span({className: "no-assoc"}, "Media is not associated with any record")
            )
        }
        var rlink = '/portal/recordsets/'+this.props.data.recordset;

        el.push(
            React.DOM.a({className: "btn button", href: rlink, key: rlink}, 
                "Go To Recordset"
            )
        );

        el.push(
            React.DOM.a({href: "#raw", 'data-toggle': "modal", 'data-target': "#raw", className: "btn button", key: 'raw-data'}, 
                "View Raw Data"
            )            
        );
        
        return (
            React.DOM.div({id: "action-buttons", key: 'buttons'}, 
                el
            )
        );
    }
});

var Table = React.createClass({displayName: 'Table',
    render: function(){
        var order=[],rows=[],self=this;

        //make ordered name keys
        _.each(dwc.order.media,function(val){
            if(_.has(self.props.record, val)){
                order.push(val);
            }
        });
        //add unknown keys to end of list
        var dif = _.difference(Object.keys(this.props.record),order);
        var merged = order.concat(dif), count=0;
        var regex = /(\bhttps?:\/\/(\S|\w)+)/;
        _.each(order,function(key){
            var name = _.isUndefined(dwc.names[key]) ? key: dwc.names[key];
            var val = self.props.record[key];
            if(_.isString(val)){
                var str;
                if(val.indexOf('<a')===0){
                    str = val;
                }else{
                    str = val.replace(regex, "<a href=\"$1\">$1</a>");
                }
                rows.push(
                    React.DOM.tr({key: count}, 
                        React.DOM.td({className: "name"}, name), 
                        React.DOM.td({className: "value", dangerouslySetInnerHTML: {__html: str}})
                    )
                );                
            }else if(_.isArray(val)){
                rows.push(
                    React.DOM.tr({key: count}, 
                        React.DOM.td({className: "name"}, name), 
                        React.DOM.td({className: "value"}, val.join(', '))
                    )
                );                 
            }else{
                rows.push(
                    React.DOM.tr({key: count}, 
                        React.DOM.td({className: "name"}, name), 
                        React.DOM.td({className: "value"}, val)
                    )
                );                 
            }
            count++
        });

        return (
            React.DOM.div({id: "meta-table"}, 
                React.DOM.table(null, 
                    rows
                )
            )
        );
    }
});

var Group = React.createClass({displayName: 'Group',
    error: function(event){
        $(event.currentTarget).attr('src','/portal/img/missing.svg');
    },
    render: function(){
        if(_.has(this.props.record, 'indexTerms') && this.props.record.indexTerms.mediarecords.length > 1){
            var imgs = [];
            var media = this.props.record.indexTerms.mediarecords;
            for(id in media){
                if(media[id] != this.props.key){
                    imgs.push(
                        React.DOM.a({href: '/portal/mediarecords/'+media[id], title: "click to open media record", key: media[id]}, 
                            React.DOM.img({className: "gallery-image", src: '//api.idigbio.org/v1/mediarecords/'+media[id]+'/media?quality=webview', onError: this.error})
                        )
                    )                    
                }
            }
            return (
                React.DOM.div({id: "other-images", className: "clearfix"}, 
                    React.DOM.h4({className: "title"}, "Other Media"), 
                    React.DOM.div({id: "images-wrapper"}, 
                        imgs
                    )
                )
            )
        }else{
            return React.DOM.span(null)
        }
    }
});

var Provider = require('./shared/provider');
var Raw = require('./shared/raw');

module.exports = React.createClass({displayName: 'exports',
    render: function(){
        var source = this.props.mediarecord;
        var name ='',info=[];
        if(_.has(this.props.record, 'indexTerms')){
            var data = this.props.record.data;
            var title = '';
            //build title
            if(_.has(data,'dwc:scientificName')) { 
                title = data['dwc:scientificName'] ;
            }else if(_.has(data, 'dwc:genus')){
                title = data['dwc:genus'];
                if(_.has(data, 'dwc:specificEpithet')){
                    title += data['dwc:specificEpithet'];
                }
            }
            if(_.isEmpty(title)){
                title = 'No Name';
            } 

            if(_.has(data,'dwc:scientificNameAuthorship')){
                info.push(data['dwc:scientificNameAuthorship']);
            }
            //build info ids,inst
            ['dwc:institutionCode','dwc:collectionCode','dwc:catalogNumber'].forEach(function(item){
                if(_.has(data,item)){
                    info.push(data[item]);
                }
            }) 

            name =  React.DOM.h1({id: "title", className: "clearfix"}, 
                React.DOM.em(null, title), 
                React.DOM.span({className: "title-addition"}, 
                    info.join(', ')
                )
            )
            //name = '<em>'+title+'</em><span class="title-addition">'+info.join(', ')+'</span>';             
        }

        return (
            React.DOM.div({className: "container-fluid"}, 
                React.DOM.div({className: "row-fluid"}, 
                    React.DOM.div({className: "span12", id: "container"}, 
                        React.DOM.div({id: "data-container", className: "clearfix"}, 
                            name, 
                            React.DOM.div({id: "data-content"}, 
                                Media({key: source.uuid, data: source.data})
                            ), 
                            React.DOM.div({id: "data-meta", className: "clearfix"}, 
                                React.DOM.div({id: "actions"}, 
                                    Buttons({data: source.indexTerms})
                                ), 
                                React.DOM.div({id: "data-table", className: "clearfix"}, 
                                    React.DOM.h4({className: "title"}, "Media Metadata"), 
                                    Table({record: source.data})
                                )
                            ), 
                            Group({record: this.props.record, key: source.uuid}), 
                            Provider({data: this.props.mediarecord.attribution})
                            
                        )
                    )
                ), 
                Raw({data: source.data})
            )
        )
    }
})
