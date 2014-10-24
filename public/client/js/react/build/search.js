/**
 * @jsx React.DOM
 */

var React = require('react')
var dwc = require('./lib/dwc_fields');
var _ = require('underscore');
var fields = require('../../lib/fields');
var Filters = require('./search/filters');

module.exports = React.createClass({displayName: 'exports',
    showPanel: function(event){
        $('#options-menu .active').removeClass('active');
        var panel = $(event.target).addClass('active').attr('data-panel');
        $('#options .section').hide();
        $('#options #'+panel).show();
    },

    getInitialState: function(){
        return {search:{filters:false,fulltext:false,image:false,geopoint:false}};
    },

    searchChange: function(key,val){
        var search = this.state.search;
        search[key]=val;
        this.setState({search: search});
        return true;
    },

    render: function(){

        return(
            React.DOM.div({id: "react-wrapper"}, 
                React.DOM.div({id: "top", className: "clearfix"}, 
                    React.DOM.div({key: "fulltext", id: "search", className: "clearfix"}, 
                        
                        React.DOM.div({id: "search-any", className: "clearfix"}, 
                            React.DOM.h3(null, React.DOM.img({id: "search-arrow-img", src: "/portal/img/arrow-green.png"}), " Start Searching"), 
                            React.DOM.div({className: "input-group"}, 
                                React.DOM.input({type: "text", className: "form-control", placeholder: "search any field"}), 
                                React.DOM.a({className: "btn input-group-addon"}, "Go")
                            ), 
                            React.DOM.div({className: "checkbox"}, 
                                React.DOM.label(null, 
                                    React.DOM.input({type: "checkbox"}), 
                                    "Must have image"
                                )
                            ), 
                            React.DOM.div({className: "checkbox"}, 
                                React.DOM.label(null, 
                                    React.DOM.input({type: "checkbox"}), 
                                    "Must have map point"
                                )
                            )
                        ), 
                        React.DOM.div({key: "filters", id: "options", className: "clearfix"}, 
                            React.DOM.ul({id: "options-menu", onClick: this.showPanel}, 
                                React.DOM.li({className: "active", 'data-panel': "filters"}, "Advanced Filters"), 
                                React.DOM.li({'data-panel': "sorting"}, "Sorting"), 
                                React.DOM.li({'data-panel': "download"}, "Download & History")
                            ), 
                            React.DOM.div({className: "section active", id: "filters"}, 
                                Filters({setFilters: this.setFilters})
                            ), 
                            React.DOM.div({className: "clearfix section", id: "sorting"}, 
                                React.DOM.div({className: "option-group"}, 
                                    React.DOM.label(null, "Sort by"), 
                                    React.DOM.select({className: "direction form-control"}, 
                                        React.DOM.option(null, "Ascending"), 
                                        React.DOM.option(null, "Descending")
                                    ), 
                                    React.DOM.select({className: "name form-control"}, 
                                        React.DOM.option(null, "Scientific Name")
                                    )

                                ), 
                                React.DOM.div({className: "option-group-add"}, 
                                     "Add another sort  ", React.DOM.span({className: "glyphicon glyphicon-plus"})
                                )
                            ), 

                            React.DOM.div({className: "clearfix section", id: "download"}, 
                                React.DOM.label(null, "Download Current Result Set")
                            )
                        )
                    ), 
                    React.DOM.div({id: "map"})
                ), 
                Results({search: this.state.search})
            )
        )
    }
})