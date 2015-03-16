/**
 * @jsx React.DOM
 */

var React = require('react');

module.exports = React.createClass({displayName: "exports",
    defaultMappingProps: function(type){
        if('box'){
            return {
                top_left: {
                    lat: false,
                    lon: false
                },
                bottom_right: {
                    lat: false,
                    lon: false
                }
            }
        }else if('radius'){
            return {
                distance: "",
                location: {
                    lat: false,
                    lon: false
                }
            }
        }
    },
    resetBounds: function(){
        /*var b = this.currentBounds();
        b.top_left.lat=false;
        b.top_left.lon=false;
        b.bottom_right.lat=false;
        b.bottom_right.lon=false;*/
        var t = this.props.mapping.type
        this.props.searchChange('mapping',{type: t, bounds: this.defaultMappingProps(t)});
    },

    mappingType: function(e){
        var t = e.target.value
        this.props.searchChange('mapping',{type: t, bounds: this.defaultMappingProps(t)});
    },
    render: function(){
        var bounds = this.props.mapping.bounds, type;
        switch(this.props.mapping.type){
            case 'box':
                type= React.createElement(Box, {searchChange: this.props.searchChange, bounds: bounds})
                break;
            case 'radius':
                type= React.createElement(Radius, {searchChange: this.props.searchChange, bounds: bounds})
                break;
        }
        return(
            React.createElement("div", {className: "clearfix section "+this.props.active, id: "mapping"}, 
                React.createElement("div", {className: "option-group", id: "mapping-options"}, 
                    React.createElement("span", {className: "title"}, "Lat/Lon Contraints"), 
                    React.createElement("a", {className: "btn pull-right", onClick: this.resetBounds}, 
                        "Clear"
                    ), 
                    React.createElement("div", {className: "form", onChange: this.mappingType}, 
                        React.createElement("label", {className: "radio-inline"}, 
                            React.createElement("input", {type: "radio", name: "mapping-type", id: "box", value: "box", checked: this.props.mapping.type=='box'}), "Bounding Box"
                        ), 
                        React.createElement("label", {className: "radio-inline"}, 
                            React.createElement("input", {type: "radio", name: "mapping-type", id: "radius", value: "radius", checked: this.props.mapping.type=='radius'}), "Radius"
                        )
                    ), 
                    type
                )
            )
        )
    }
})

var Box = React.createClass({displayName: "Box",
    currentBounds: function(){
        //use this function instead of calling this.props.bounds so 
        //we always pass a new object when updating bound changes
        var b = this.props.bounds;
        return {
            top_left: {
                lat: b.top_left.lat,
                lon: b.top_left.lon
            },
            bottom_right: {
                lat: b.bottom_right.lat,
                lon: b.bottom_right.lon
            }
        }
    },
    degreeChange: function(event){
        var bounds = this.currentBounds();
        var val = event.currentTarget.value;
        if(_.isEmpty(helpers.strip(val))){
            val = false;
        }
        bounds[event.currentTarget.attributes['data-corner'].value][event.currentTarget.attributes['data-name'].value]=val;
        this.props.searchChange('mapping',{type: "box", bounds: bounds});
    },
    render: function(){
        var bounds = this.props.bounds;
        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "ordinates clearfix"}, 
                    React.createElement("label", {className: "title"}, "NorthWest"), 
                    React.createElement("div", {className: "pull-left ordinate"}, 
                        "Lat:", 
                        React.createElement("input", {type: "text", 
                            onChange: this.degreeChange, 
                            value: !bounds.top_left.lat ? '' : bounds.top_left.lat, 
                            placeholder: "90.0", 
                            "data-corner": "top_left", 
                            "data-name": "lat", 
                            className: "coordinate form-control"})
                    ), 
                    React.createElement("div", {className: "ordinate"}, 
                        "Lon:", 
                        React.createElement("input", {type: "text", 
                            onChange: this.degreeChange, 
                            value: !bounds.top_left.lon ? '' : bounds.top_left.lon, 
                            placeholder: "-180.0", 
                            "data-corner": "top_left", 
                            "data-name": "lon", 
                            className: "coordinate form-control"})
                    )
                ), 
                React.createElement("div", {className: "ordinates clearfix"}, 
                    React.createElement("label", {className: "title"}, "SouthEast"), 
                    React.createElement("div", {className: "pull-left ordinate"}, 
                        "Lat:", 
                        React.createElement("input", {type: "text", 
                            onChange: this.degreeChange, 
                            value: !bounds.bottom_right.lat ? '' : bounds.bottom_right.lat, 
                            placeholder: "-90.0", 
                            "data-corner": "bottom_right", 
                            "data-name": "lat", 
                            className: "coordinate form-control"})
                    ), 
                    React.createElement("div", {className: "ordinate"}, 
                        "Lon:", 
                        React.createElement("input", {type: "text", 
                            onChange: this.degreeChange, 
                            value: !bounds.bottom_right.lon ? '' : bounds.bottom_right.lon, 
                            placeholder: "180.0", 
                            "data-corner": "bottom_right", 
                            "data-name": "lon", 
                            className: "coordinate form-control"})
                    )
                )
            )
        )
    }
});

var Radius = React.createClass({displayName: "Radius",
    render: function(){
        var bounds = this.props.bounds;
        return(
            React.createElement("div", null, 
                React.createElement("div", {className: "ordinates clearfix"}, 
                    React.createElement("label", {className: "title"}, "Point Location"), 
                    React.createElement("div", {className: "pull-left ordinate"}, 
                        "Lat:", 
                        React.createElement("input", {type: "text", 
                            onChange: this.degreeChange, 
                            value: !bounds.location.lat ? '' : bounds.location.lat, 
                            "data-name": "lat", 
                            className: "coordinate form-control"})
                    ), 
                    React.createElement("div", {className: "ordinate"}, 
                        "Lon:", 
                        React.createElement("input", {type: "text", 
                            onChange: this.degreeChange, 
                            value: !bounds.location.lon ? '' : bounds.location.lon, 
                            "data-name": "lon", 
                            className: "coordinate form-control"})
                    )
                ), 
                React.createElement("div", {className: "ordinates clearfix"}, 
                    React.createElement("label", {className: "title"}, "Radius Length"), 
                    React.createElement("div", {className: "pull-left ordinate"}, 
                        React.createElement("input", {type: "text", 
                            onChange: this.degreeChange, 
                            value: !bounds.distance ? '' : bounds.distance, 
                            "data-name": "distance", 
                            className: "coordinate form-control"})
                    )
                )
            )
        ) 
    }
})