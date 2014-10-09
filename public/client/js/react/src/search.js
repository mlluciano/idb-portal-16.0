/**
 * @jsx React.DOM
 */

var React = require('react')
var dwc = require('./lib/dwc_fields');
var _ = require('underscore');


module.exports = React.createClass({
    showPanel: function(event){
        debugger
        $('#options-menu .active').removeClass('active');
        var panel = $(event.target).addClass('active').attr('data-panel');
        
        $('#options .section').hide();
        $('#options #'+panel).show();
    },
    render: function(){

        return(
            <div id='react-wrapper'>
                <div id="top" className="clearfix">
                    <div key='fulltext' id="search" className="clearfix">
                        
                        <div id="search-any" className="clearfix">
                            <h3><img id="search-arrow-img" src="/portal/img/arrow-green.png"/> Start Searching</h3>
                            <div className="input-group">
                                <input type="text" className="form-control" placeholder="search any field" />
                                <a className="btn input-group-addon">Go</a>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input type="checkbox" />
                                    Must have image
                                </label>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input type="checkbox" />
                                    Must have map point
                                </label>
                            </div>
                        </div>
                        <div key='filters' id="options" className="clearfix">
                            <ul id="options-menu" onClick={this.showPanel}>
                                <li className="active" data-panel="sorting">Sorting</li>
                                <li data-panel="filters">Advanced Filters</li>
                                <li data-panel="download">Download &amp; History</li>
                            </ul>
                            <div className="clearfix section active" id="sorting">
                                <div className="option-group">
                                    <label>Sort by</label>
                                    <select className="direction form-control">
                                        <option>Ascending</option>
                                        <option>Descending</option>
                                    </select>
                                    <select className="name form-control">
                                        <option>Scientific Name</option>
                                    </select>

                                </div>
                                <div className="option-group-add">
                                     Add another sort &nbsp;<span className="glyphicon glyphicon-plus"></span> 
                                </div>
                            </div>
                            <div className="clearfix section" id="filters">
                                <h4>Advanced Filters</h4>
                                <select placeholder="select to add"><option value="select">select to add</option></select>
                            </div>
                            <div className="clearfix section" id="download">
                                <label>Download Current Result Set</label>
                            </div>
                        </div>
                    </div>
                    <div id="map"></div>
                </div>
                <div id="results" className="clearfix">
                    <ul id="results-menu">
                        <li>Table View</li>
                        <li>Label View</li>
                        <li>Images</li>
                    </ul>
                    <div className="panel"></div>
                    <div className="panel"></div>
                    <div className="panel"></div>
                </div>
            </div>
        )
    }
})