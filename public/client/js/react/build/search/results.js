
var React = require('react');
var idbapi = require('../../../lib/idbapi');
var queryBuilder = require('../../../lib/querybuilder');
var PureRender = require('react/addons').addons.PureRenderMixin;

React.initializeTouchEvents(true);

var Results = module.exports =  React.createClass({displayName: "exports",
    //mixins: [PureRender],
    lastQueryStringed: '',
    getInitialState: function(){
        //this.getResults();

        return {results: [], total: 0, search: this.props.search, hasMore: false, loading: true};
    },
    shouldComponentUpdate: function(nextProps, nextState){

        if(nextProps.view !== this.props.view){
            return true;
        }else{
            return false;
        }
    },
    componentWillMount: function(){
        var self=this;
        this.lastQueryTime = 0;
        /*this results getter attempts to minimize excessive results queries with lots of key strokes
        and ensures that the last key press results in the proper set of results as responses can be out of 
        order*/
        this.getResults = _.debounce(function(){
         
            var d = new Date, searchState = self.state.search, query = queryBuilder.makeSearchQuery(searchState);
            var now = d.getTime();
            //constant passing of props forces many unncessary request. This cheap method checks
            //see if there truely is a new query to run

            if(JSON.stringify(query) !== self.lastQueryStringed){
                //setting results to empty array forces
                //spinner to show for new searches
                //THESE state change tricks should not happen anywhere else
                if(searchState.from === 0){
                    self.setState({results: [], loading: true})
                }
                self.lastQueryTime = now;
                idbapi.search(query,function(response){
                    if(now>= self.lastQueryTime){
                        var res, more=false;
                        if(searchState.from > 0){
                            res = self.state.results.concat(response.items);
                        }else{
                            res = response.items;
                        }
                        if(response.itemCount > (searchState.from+searchState.size)){
                            more=true;
                        }
                        self.setState({results: res, total: response.itemCount, hasMore: more, loading: false},function(){
                            self.forceUpdate();
                        });
                    }
                })
            }
            
            self.lastQueryStringed = JSON.stringify(query);


        },300,{leading: true, trailing: true});
    },
    componentDidMount: function(){
        window.onscroll = this.resultsScroll;
        this.getResults(this.props.search);
    },
    componentWillReceiveProps: function(nextProps){
        //component should only recieve search as props
        //debugger
        //var isNewSearch =  _.isEqual(this.props.search, nextProps.search);
       
       //if(!_.isEqual(nextProps.search,this.props.search)){
            this.setState({search: _.cloneDeep(nextProps.search)},function(){
                this.forceUpdate();
                this.getResults(this.state.search); 
            });
       //}
    },
    viewChange: function(event){
        event.preventDefault();
        var view = event.currentTarget.attributes['data-value'].value;
        this.props.viewChange('resultsTab', view);
    },
    //this is not a synthentic event
    resultsScroll: function(e){
        var search = _.cloneDeep(this.state.search);

        if(this.state.total > search.from + search.size){
            if($(window).scrollTop() + 40 >= $(document).height() - $(window).height()){
                search.from += search.size;
                this.setState({search: search, loading: true},function(){
                   this.forceUpdate();
                   this.getResults(); 
                }); 
            }
        }
    },
    loadMoreResults: function(){
        var search = _.cloneDeep(this.state.search);

        if(this.state.total > search.from + search.size){
            search.from += search.size;
            this.setState({search: search, loading: true},function(){
               this.getResults(); 
            }); 
        }
    },
    render: function(){
        var search = this.props.search, self=this, li=[];
        switch(this.props.view){
            case 'list':
                results = React.createElement(ResultsList, {
                            search: this.state.search, results: this.state.results, 
                            searchChange: this.props.searchChange, loading: this.state.loading});
                break;
            case 'labels':
                results = React.createElement(ResultsLabels, {results: this.state.results, loading: this.state.loading});
                break;
            case 'images':
                results = React.createElement(ResultsImages, {search: this.state.search, results: this.state.results, loading: this.state.loading});
                break;
        }
        ['list','labels','images'].forEach(function(item){
            var cl = item == self.props.view ? 'active' : ''; 
            li.push(
                React.createElement("li", {key: 'tab-'+item, onClick: self.viewChange, "data-value": item, className: cl}, helpers.firstToUpper(item))
            )
        })
        if(this.state.search.from + this.state.search.size < this.state.total){
            $('footer').hide();
        }else{
            $('footer').show();
        }        
        return(
            React.createElement("div", {id: "results", className: "clearfix", onScroll: this.resultsScroll}, 
                React.createElement("ul", {id: "results-menu", className: "pull-left"}, 
                    li
                ), 
                React.createElement("div", {className: "pull-right total"}, 
                    "Total: ", helpers.formatNum(parseInt(this.state.total))
                ), 
                results
            )
        )
    }
});

var sortClick=false;
var ResultsList = React.createClass({displayName: "ResultsList",
    mixins: [PureRender],
    getInitialState: function(){
        if(_.isUndefined(localStorage) || _.isUndefined(localStorage.viewColumns)){
            var cols = this.defaultColumns();
            localStorage.setItem('viewColumns',JSON.stringify({'columns': cols}));
            return {columns: cols};
        }else{
            return {columns: JSON.parse(localStorage.getItem('viewColumns')).columns};
        }
    },
    defaultColumns: function(){
        return ['family','scientificname','datecollected','country','institutioncode','basisofrecord'];
    },
    setColumns: function(columns){
        this.setState({columns: columns});
        if(localStorage){
            localStorage.setItem('viewColumns',JSON.stringify({'columns':columns}));
        }
    },
    columnCheckboxClick: function(e){
        var columns = _.cloneDeep(this.state.columns);
        if(e.currentTarget.checked===true){
            columns.push(e.currentTarget.name);
        }else{
            columns.splice(columns.indexOf(e.currentTarget.name),1);
        }
        this.setColumns(columns);
    },
    resetColumns: function(){
        this.setColumns(this.defaultColumns());
    },
    sortColumn: function(e){
        e.preventDefault();
        //sorted column sorts the top level sort value in search and new sorting items length
        //shall not exceed original length
        var dir, search = _.cloneDeep(this.props.search), name=e.currentTarget.attributes['data-term'].value,
        sort={name: name}, sorting=search.sorting, curlength = sorting.length;
        if(_.isUndefined(e.currentTarget.attributes['data-sort'])){
            dir='asc';
        }else{
            dir = e.currentTarget.attributes['data-sort'].value == 'asc' ?  'desc': 'asc';
        }
        sort.order = dir;
     
        var list=[];
        _.each(sorting,function(item){
            list.push(item.name);
        })
        var ind= list.indexOf(name),len=list.length;
        if(ind>-1){
            sorting.splice(ind,1);
        }
        sorting.unshift(sort);
        if(sorting.length>curlength && curlength > 0){
            sorting.pop();
        }
        sortClick=true;
        this.props.searchChange('sorting',sorting);
    },
    openRecord: function(e){
        e.preventDefault();
        e.stopPropagation();
        //to prevent opening if hiliting text
        
        if(window.getSelection().toString().length===0 || (e.target.nodeName=='I' || e.target.nodeName=='BUTTON')){
           window.open('/portal/records/'+e.currentTarget.id,e.currentTarget.id); 
        }
        
    },
    /*setSortable: function(){
        var self=this;
        $('#results-headers').sortable({
            update: function(event,ui){
                var headers = this;
                var cols = $(this).sortable('toArray');
                $(headers).sortable('destroy');
                self.setColumns(cols);

            },
            items: "> .data-column",
            containment: 'parent'
        });
    },
    componentDidMount: function(){
        //this.setSortable();
    },
    componentDidUpdate: function(){
        //this.setSortable();
    },*/
    render: function(){
        var columns = this.state.columns,self=this;
     
       //['scientificname','genus','collectioncode','specificepithet','commonname'];
        var rows=[];
        var headers=[];
        //results table
        var sorted = _.isEmpty(self.props.search.sorting) ? {name: undefined} : self.props.search.sorting[0];
        var style={width: (Math.floor(100/columns.length))+'%'};
        columns.forEach(function(item){
            if(sorted.name===item){
                var icon = sorted.order == 'asc' ? 'glyphicon-chevron-up' : 'glyphicon-chevron-down';
                //sort click spinner
                var sym;
                if(self.props.loading && sortClick){
                    sym = React.createElement("i", {className: "spinner"});
                    sortClick=false;
                }else{
                    sym = React.createElement("i", {className: "glyphicon "+icon});
                }
                headers.push(
                    React.createElement("th", {key: 'header-'+item, id: item, className: "data-column", style: style, "data-term": item, "data-sort": sorted.order, onClick: self.sortColumn}, 
                        fields.byTerm[item].name, 
                        sym
                    )
                ) 
            }else{
                headers.push(
                    React.createElement("th", {key: 'header-'+item, id: item, className: "data-column", style: style, "data-term": item, onClick: self.sortColumn}, fields.byTerm[item].name)
                ) 
            }
        });
        //add column list button
        headers.push(
            React.createElement("th", {key: 'header-select', style: {width: '80px', fontSize: '10px', textAlign: 'center'}}, 
                React.createElement("button", {className: "pull-left", "data-toggle": "modal", "data-target": "#column-list"}, 
                    "Columns"
                )
            )
        )
        this.props.results.forEach(function(item,index){
            var tds = [];
            columns.forEach(function(name,ind){
                var val;
                if(_.isUndefined(fields.byTerm[name].dataterm)){
                    val = helpers.check(item.indexTerms[name]);
                }else if( _.isUndefined(fields.byTerm[name].dataterm) === false && _.isUndefined(item.indexTerms[name]) === false && _.isUndefined(item.data[fields.byTerm[name].dataterm])){
                    val = helpers.check(item.indexTerms[name]);
                }else{
                    val = helpers.check(item.data[fields.byTerm[name].dataterm]);
                }

                if(_.isEmpty(val)){
                    val = React.createElement("span", {className: "no-data"}, "no data");
                }

                /*if(columns.length-1 === ind){
                    tds.push(<td key={'row-'+index+'-cell-'+ind} colSpan="2">{val}</td>);
                }else{
                    tds.push(<td key={'row-'+index+'-cell-'+ind}>{val}</td>);
                }*/
                tds.push(React.createElement("td", {key: 'row-'+index+'-cell-'+ind}, val));
            })
            //add openrecord column
            tds.push(React.createElement("td", {key: 'row-'+index+'-open', className: "open"}, React.createElement("a", {className: "pull-left", id: item.uuid, onClick: self.openRecord, title: "view full record"}, "view")));
            rows.push(
                React.createElement("tr", {key: 'row-'+index}, 
                    tds
                )
            );
        })
        if(this.props.loading){
            rows.push(
                React.createElement("tr", {key: 'loading-row', className: "no-results-row"}, 
                    React.createElement("td", {colSpan: columns.length+1}, 
                        React.createElement("i", {className: "spinner"})
                    )
                )
            );
        }else if(rows.length===0){
            rows.push(React.createElement("tr", {key: 'row-no-results', className: "no-results-row"}, React.createElement("td", {colSpan: columns.length+1}, "No Matching Records")))
        }
        //column selection modal list
        var list=[];
        //sort list
        //fgroups.push(<option value="0">select a field</option>);

        _.each(fields.searchGroups,function(val){
            var group = [];
            group.push(
                React.createElement("tr", {key: val}, React.createElement("td", {className: "bold"}, fields.groupNames[val]))
            )
            _.each(fields.byGroup[val],function(field){
                if(field.hidden && !field.results){
                    //noop
                }else{
                    var disabled=false,checked=false;
                    if(columns.indexOf(field.term) > -1){
                        checked=true;
                        if(columns.length===1){
                            disabled=true;
                        }
                    }
                    group.push(
                        React.createElement("tr", {key: 'column-select-'+field.term}, 
                            React.createElement("td", null, 
                                React.createElement("label", null, 
                                    React.createElement("input", {name: field.term, onChange: self.columnCheckboxClick, type: "checkbox", checked: checked, disabled: disabled}), " ", field.name
                                )
                            )
                        )
                    )
                }
            });
            list.push(React.createElement("table", {key: "group-"+group, className: "group-table"}, group))
        });

        return(
            React.createElement("div", {id: "result-list", className: "panel"}, 
                React.createElement("div", {id: "column-list", className: "modal fade"}, 
                    React.createElement("div", {className: "modal-dialog"}, 
                        React.createElement("div", {className: "modal-content"}, 
                            React.createElement("div", {className: "modal-header"}, 
                                React.createElement("label", null, "Select Display Columns"), 
                                React.createElement("button", {onClick: this.resetColumns, id: "reset"}, 
                                    "Reset"
                                ), 
                                React.createElement("button", {type: "button", className: "close pull-right", "data-dismiss": "modal"}, 
                                    React.createElement("span", {"aria-hidden": "true"}, "×")
                                )
                            ), 
                            React.createElement("div", {className: "modal-body clearfix"}, 
                                
                                    list
                                
                            ), 
                            React.createElement("div", {className: "modal-footer"}

                            )
                        )
                    )
                ), 
                React.createElement("table", {id: "data-table", className: "table table-condensed"}, 
                    React.createElement("thead", null, 
                        React.createElement("tr", {id: "results-headers"}, headers)
                    ), 
                    React.createElement("tbody", null, 
                        rows
                    )
                )
            )
        )
    }
});

var ResultsLabels = React.createClass({displayName: "ResultsLabels",
    mixins: [PureRender],
    makeLabel: function(result,id){
        var data = result.indexTerms, raw = result.data;
        var txt = '';
        var content=[];
        var title = '',info=[];
        //build title
        //var index = this.props.data.indexTerms, data=this.props.data.data;
        if(_.has(data,'scientificname')) { 
            title = _.capitalize(data['scientificname']);
        }else if(_.has(data, 'genus')){
            title = _.capitalize(data['genus']);
            if(_.has(data, 'specificepithet')){
                title += ' '+data['specificepithet'];
            }
        }
        if(_.isEmpty(title)){
            title = React.createElement("em", null, "No Name");
        } 
        var auth='';
        if(_.has(raw, 'dwc:scientificNameAuthorship')){
            auth = React.createElement("span", {className: "author"}, raw['dwc:scientificNameAuthorship']);
        }

        var family='';
        if(_.has(data,'family')){
            family= _.capitalize(data.family);
        }

        if(_.has(raw, 'dwc:eventDate')){
            content.push(React.createElement("span", {key: "event-date", className: "date"}, raw['dwc:eventDate']));
        }
         var l=[];
        ['dwc:country','dwc:stateProvince','dwc:county','dwc:locality'].forEach(function(item){
            if(_.has(raw,item)){
                l.push(raw[item])
            }
        })
        if(l.length>0){
            content.push(React.createElement("span", {key: "locality", className: "locality"}, l.join(', ')));
        }
        if(_.has(data, 'geopoint')){
            content.push(React.createElement("span", {key: "geopoint", className: "geopoint", dangerouslySetInnerHTML: {__html: '<b>Lat:</b> '+ helpers.convertDecimalDegrees(data.geopoint.lat)+ '&nbsp;&nbsp; <b>Lon:</b> '+ helpers.convertDecimalDegrees(data.geopoint.lon)}}));
        }
        var c=[],tits=['Institution','Collection','Catalog Number'];
        ['dwc:institutionCode','dwc:collectionCode','dwc:catalogNumber'].forEach(function(item,index){
            if(_.has(raw,item)){
                c.push(raw[item])
            }
        })
        if(c.length>0){
            content.push(React.createElement("span", {key: "collection", className: "collection"}, c.join(', ')))
        }
        var taxa=[];
        ['kingdom','phylum','class','order'].forEach(function(item){
            if(_.has(data,item)){
                taxa.push(_.capitalize(data[item]));
            }
        });
        if(taxa.length>0){
            content.push(React.createElement("span", {key: "higher", className: "highertaxa"}, taxa.join(', ')));
        }

        if( data.hasImage ){ 
            var imgcount,img;
            if(data.mediarecords.length > 1){ 
                imgcount = (
                    React.createElement("span", {className: "image-count"}, 
                        data.mediarecords.length
                    )
                )
            }else{
                imgcount = React.createElement("span", null);
            } 
          
            img = (
                React.createElement("span", {
                    key: 'media-'+result.uuid+this.props.stamp, 
                    className: "image-wrapper", 
                    id: data.mediarecords[0], 
                    onClick: this.openMedia, 
                    title: "click to open media record"}, 
                    imgcount, 
                    React.createElement("img", {
                        onError: this.errorImage, 
                        className: "pull-right label-image", 
                        alt: title, 
                        src: "https://api.idigbio.org/v1/records/"+result.uuid+"/media?quality=thumbnail"})
                )  
            )
     
         } 
      
        return (
            React.createElement("div", {key: 'label-'+id, className: "pull-left result-item result-label"}, 
                React.createElement("h5", {className: "title", title: "click to open record"}, React.createElement("a", {href: '/portal/records/'+result.uuid, target: result.uuid}, title, " ", auth)), 
                React.createElement("h5", {className: "family"}, family), 
                img, 
                React.createElement("p", {className: "content"}, 
                    content
                )
            )
        )
    },
    errorImage: function(e){
        //debugger
        e.target.attributes['src'].value='/portal/img/notavailable.jpg';
    },
    openMedia: function(e){
        e.preventDefault();
        window.open('/portal/mediarecords/'+e.currentTarget.id,'_blank');
    },
    openRecord: function(e){
        e.preventDefault();
        window.open('/portal/records/'+e.currentTarget.id,'_blank');
    },
    render: function(){
        var labels = [],self=this;
        this.props.results.forEach(function(result,ind){
            labels.push(self.makeLabel(result,result.uuid));
        })
        if(labels.length===0 && this.props.loading===false){
            labels.push(                
                React.createElement("div", {key: "no-records", className: "no-records"}, 
                    React.createElement("h4", null, "No Matching Records")
                )
            );
        }
        if(this.props.loading){
            
            labels.push(
                React.createElement("div", {key: 'loading-div', className: "label-loading clearfix pull-left"}, 
                    React.createElement("i", {className: "spinner"})
                )
            )
        }
        return (
            React.createElement("div", {id: "result-labels", className: "panel"}, 
                labels
            )
        )
    }
});

var ResultsImages = React.createClass({displayName: "ResultsImages",
    mixins: [PureRender],
    getImageOnlyResults: function(search){

        var d = new Date, self=this, searchState = _.cloneDeep(search);
        searchState.image=true;
        var query = queryBuilder.makeSearchQuery(searchState);
        var now = d.getTime();
        self.lastQueryTime = now;
        self.setState({loading: true})
        idbapi.search(query,function(response){
            //make sure last query run is the last one that renders
            //as responses can be out of order
            if(now>= self.lastQueryTime){
                var res;
                if(searchState.from > 0){
                    res = self.state.results.concat(response.items);
                }else{
                    res = response.items;
                }
                self.setState({results: res, loading: false},function(){
                    self.forceUpdate();
                });
            }
        });
    },
    getInitialState: function(){
        return {results: this.props.results, loading: false};
    },
    errorImage: function(e){
        e.target.attributes['src'].value = '/portal/img/missing.gif';
    },
    componentWillMount: function(){
        if(!this.props.search.image){
            this.getImageOnlyResults(this.props.search);
        }
    },
    componentWillReceiveProps: function(nextProps){
        if(nextProps.search.image){
            this.setState({results: nextProps.results, loading: false})
        }else{
            this.getImageOnlyResults(nextProps.search);
        }
    },
    makeImageText: function(data){

    },
    makeImage: function(uuid,record){
        var count = record.indexTerms.mediarecords.indexOf(uuid)+1 + ' of '+ record.indexTerms.mediarecords.length;
        var name=[], specimen = record.data, index=record.indexTerms;
        if(typeof index.scientificname == 'string') { 
            name.push(index.scientificname);
        }else{  
            name.push(index.genus);
            name.push(index.specificepithet);
        } 
        name.push(specimen["dwc:scientificnameauthorship"]); 
        _.pull(name,undefined);
        var text=_.without([specimen['dwc:institutionCode'],specimen['dwc:collectionCode'],specimen['dwc:eventdate']],undefined);

        return (
            React.createElement("a", {className: "image", target: uuid, href: "/portal/mediarecords/"+uuid, key: 'image-'+uuid}, 
                React.createElement("span", {className: "img-count"}, count), 
                React.createElement("img", {alt: name.join(' '), 
                src: "https://api.idigbio.org/v1/mediarecords/"+uuid+"/media?quality=thumbnail", 
                onError: this.errorImage}), 
                React.createElement("div", {className: "gallery-image-text"}, 
                    React.createElement("div", {className: "image-text"}, 
                        React.createElement("span", {className: "title"}, _.capitalize(name.join(' '))), 
                        React.createElement("span", {className: ""}, text.join(', '))
                    )
                )
            )
        )
    },
    render: function(){
        var images=[],self=this,key=0;
        this.state.results.forEach(function(record,index){
            if(_.isArray(record.indexTerms.mediarecords)){
                record.indexTerms.mediarecords.forEach(function(uuid){
                    images.push(self.makeImage(uuid,record));
                    key++;
                })
            }
        });
        if(images.length === 0 && !self.state.loading){
            images.push(
                React.createElement("div", {key: "no-images", className: "no-images"}, 
                    React.createElement("h4", null, "No Images Available")
                )
            )
        }
        if(self.state.loading){
            images.push(
                React.createElement("div", {key: "loading-images", id: "loading-images", className: "clearfix"}, 
                    React.createElement("i", {className: "spinner"})
                )
            )
        }
        return (
            React.createElement("div", {id: "results-images", className: "panel"}, 
                React.createElement("div", {id: "images-wrapper", className: "clearfix"}, 
                    images
                )
            )
        )
    }
});