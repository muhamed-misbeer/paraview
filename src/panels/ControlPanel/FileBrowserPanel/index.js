import React from 'react';
import PropTypes from 'prop-types';

import FileBrowserWidget from 'paraviewweb/src/React/Widgets/FileBrowserWidget';
import style from 'PVWStyle/ReactWidgets/FileBrowserWidget.mcss';

import { connect } from 'react-redux';
import { selectors, actions, dispatch } from '../../../redux';
import { getActiveSourceId } from '../../../redux/selectors/proxies';
import { SkullPoint, SkullGaussians } from './skull'
import { BonePoints, BoneGaussians } from './bone'
import { InitialPoints, InitialGaussians } from './initial'

// ----------------------------------------------------------------------------

export class FileBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.processAction = this.processAction.bind(this);
    this.onChangeValue = this.onChangeValue.bind(this);
    //this.props.openFiles('C3N-01752_CT.nrrd');

    this.state = {
      repCheck: false,
      nrrdSourceID: 0,
    };
  }

  path(pathToList, path) {
    const reqPath = pathToList === path[0] ? '.' : pathToList;
    this.props.storeActiveDirectory(reqPath);
    this.props.fetchServerDirectory(reqPath);
  }

  directory(name) {
    const pathToList = [].concat(this.props.fileListing.path, name).join('/');
    this.props.storeActiveDirectory(pathToList);
    this.props.fetchServerDirectory(pathToList);
  }

  group(name, files) {
    // const basePath = [].concat(this.props.activePath.split('/'));
    // basePath.shift(); // Remove the front 'Home'
    // const fullPathFiles = files.map((f) => [].concat(basePath, f).join('/'));
    // this.props.openFiles(fullPathFiles);

    files.map((f)=>{
      this.file(f);
    })
  }

  file(name) {
    const pathList = [].concat(this.props.activePath.split('/'), name);
    pathList.shift(); // Remove the front 'Home'
    const fullPath = pathList.join('/');
    this.props.openFiles(fullPath);
  }


  setRepresentation(name) {
    console.log(name);
  }

  processAction(e, action, name, files, sourceIds) {
    if (!e.target.checked) {
      if(action=="group"){
        sourceIds.map((id)=>{
          this.props.deleteProxy(id);
          return
        })
      }
      this.props.deleteProxy(e.target.dataset.id);      
      return
    }
    if (name == 'C3N-01752_CT.nrrd') {
      this.setState({
        repCheck: false
      });
    }
    this[action](name, files);
  }

  onChangeValue(event) {       
    if (event.target.value == 'Bone') {
      this.props.setOpacityPoints(SkullPoint, SkullGaussians);
    } else if (event.target.value == 'Skull') {
      this.props.setOpacityPoints(BonePoints, BoneGaussians);
    } else {
      this.props.setOpacityPoints(InitialPoints, InitialGaussians);
    }
  }

  getSourceDetails(label, pipeline, type) {
    
    var d = this.props.data.filter(function (item) { return item.file_ids == label; });
    if (d.length === 0) {
      return { source_id: 0, is_checked: false, rep_id: 0 }
    }
    var p = pipeline.filter(function (source) { return source.name == d[0].source_name; });

    console.log("getSourceDetails p");
    console.log(p);

    if (p.length === 0) {
      return { source_id: 0, is_checked: false, rep_id: 0 }
    } else {

      if(type =="group"){
        var sourceIds = [];
        p.map((pSource)=>{
          sourceIds.push(pSource.id);
        });        
        return { source_id: p[0].id, is_checked: true, rep: p[0].rep , source_ids : sourceIds };
      }
      return { source_id: p[0].id, is_checked: true, rep: p[0].rep }
    }
  }

  render() {    
    if (!this.props.visible || !this.props.fileListing) {
      return null;
    }
    this.props.list = [];

    console.log("file group");
    console.log(this.props.fileListing.groups);
    this.props.fileListing.groups.map((item, index) => {
      var details = this.getSourceDetails(item.label, this.props.pipeline.sources, "group");
      this.props.list.push({
        item: item, index: index, action: "group",
        source_id: details.source_id,
        is_checked: details.is_checked,
        rep: details.rep,
        source_ids : details.source_ids
      });
    });

    // this.props.fileListing.groups[0].files.map((item, index) => {
    //   var details = this.getSourceDetails(item.label, this.props.pipeline.sources);
    //   this.props.list.push({
    //     item: item, index: index, action: "file",
    //     source_id: 0,
    //     is_checked: false,
    //     rep: 0
    //   });
    // });

    this.props.fileListing.files.map((item, index) => {
      var details = this.getSourceDetails(item, this.props.pipeline.sources, "file");
      this.props.list.push({
        item: item, index: index, action: "file",
        source_id: details.source_id,
        is_checked: details.is_checked,
        rep: details.rep,
        source_ids: 0
      });
    });


    console.log("Pipeline Source");
    console.log(this.props.pipeline.sources);
    this.props.pipeline.sources.map((item, index) => {      
      var rep = item.rep;
      var sourceId = item.id;
      var viewId = this.props.pipeline.view;
      var r = this.props.representation;
      var d = this.props.data.filter(function (s) { return s.source_name == item.name; });
      if (d.length != 0) {
        if(this.state.repCheck && this.props.activeSourceId != this.state.nrrdSourceID){
            dispatch(actions.active.activate(this.state.nrrdSourceID, 'source'));
        }
        if (d[0].file_ids === 'C3N-01752_CT.nrrd' && !this.state.repCheck) {
          const changeToPush = [];
          const owners = [];
          changeToPush.push({ id: rep, name: 'Representation', value: 'Volume' });
          owners[0] = sourceId;
          owners[1] = rep;
          owners[2] = viewId;
          this.props.propertyChange({ changeSet: changeToPush, owners });
          this.props.colorBy(rep, "POINTS", "ImageFile", "array", "Magnitude", 0, false)
          dispatch(actions.active.activate(sourceId, 'source'));
          this.setState({
            repCheck: true,
            nrrdSourceID: sourceId
          });
        }
      }
    });

    return (
      <>       
        <div style={{ margin: "10px 11px", height: "240px" }}>         
          {this.props.list.map((i, index) => (
            <ul key={index} style={{ listStyleType: "none", margin: "0px", padding: "6px", display: "flex", alignItems: "center" }}>
              <input type="checkbox" style={{ marginRight: "10px" }} data-id={i.source_id} checked={i.is_checked} 
              onClick={(e) => this.processAction(e, i.action, i.action === "group" ? i.item.label : i.item, 
              i.action === "group" ? i.item.files : null, i.action === "group" ? i.source_ids : null)} />
              <i className={i.action === "group" ? style.groupIcon : style.fileIcon} />
              <li><p style={{ margin: "0px" }}>{i.action === "group" ? i.item.label : i.item}</p></li>              
            </ul>
          ))}
        </div>

        
        <div>
          <p style={{ margin: '0px', fontSize: "17px", paddingLeft: "5px" }}>Transform Functions</p>
          <hr />
          <div onChange={this.onChangeValue} style={{ display: "flex", flexDirection: "column",marginLeft:"17px" }}>
            <div style={{padding:"4px 0px"}}>
              <input type="radio" value="Default" id="default" name="tfunction" style={{marginRight:"10px"}}/>
              <label for="default">Default</label>
            </div>
            <div style={{padding:"4px 0px"}}>
              <input type="radio" value="Bone" id="bone" name="tfunction" style={{marginRight:"10px"}}/>
              <label for="bone">Bone</label>
            </div>
            <div style={{padding:"4px 0px"}}>
              <input type="radio" value="Skull" id="skull" name="tfunction" style={{marginRight:"10px"}}/>
              <label for="skull">Skull</label>
            </div>
          </div>
        </div>
      </>
    );
  }
}

FileBrowser.propTypes = {
  className: PropTypes.string,
  visible: PropTypes.bool,
  fileListing: PropTypes.object,
  activePath: PropTypes.string.isRequired,
  pipeline: PropTypes.object.isRequired,
  gaussians: PropTypes.object.isRequired,
  representation: PropTypes.object.isRequired,
  activeSourceId : PropTypes.object.isRequired,

  fetchServerDirectory: PropTypes.func.isRequired,
  storeActiveDirectory: PropTypes.func.isRequired,
  openFiles: PropTypes.func.isRequired,
  data: PropTypes.array,
  list: PropTypes.array,
  deleteProxy: PropTypes.func.isRequired,
  propertyChange: PropTypes.func.isRequired,
  colorBy: PropTypes.func.isRequired,

  setOpacityPoints: PropTypes.func.isRequired,
};

FileBrowser.defaultProps = {
  visible: true,
  className: '',
  fileListing: undefined,
  pipeline: undefined,
  gaussians: undefined,
  repSet: false,
  representation: undefined,
  activeSourceId: undefined,
  list: [],
  // data: [{
  //   "source_name": "C3N01752_CT_LS_*",
  //   "file_ids": "C3N01752_CT_LS_*.stl",
  //   "rep_settings": "Surface",
  //   "color_settings": "Solid",
  //   "type": "group"
  // },
  // {
  //   "source_name": "C3N-01752_CT.nr*",
  //   "file_ids": "C3N-01752_CT.nrrd",
  //   "rep_settings": "Volume",
  //   "color_settings": "Image File",
  //   "type": "file"
  // }]

   data: [{
    "source_name": "C3N01752_CT_LS_*",
    "file_ids": "C3N01752_CT_LS_*.stl",
  },
  {
    "source_name": "C3N-01752_CT.nr*",
    "file_ids": "C3N-01752_CT.nrrd",
  }]

};

// Binding --------------------------------------------------------------------
/* eslint-disable arrow-body-style */

export default connect(
  (state) => {
    return {
      fileListing: selectors.files.getFileListing(state),
      //opacityPoints: selectors.colors.getPiecewisePoints(state),
      activePath: selectors.files.getActivePath(state),
      pipeline: selectors.proxies.getPipeline(state),
      representation: selectors.proxies.getRepresentationPropertyGroup(state),      
      activeSourceId : selectors.proxies.getActiveSourceId(state),
      setOpacityPoints(points, gaussians) {

        console.log(selectors.colors.getColorByArray(state));
        const serverFormat = [];
        points.forEach((p) => {
          serverFormat.push(p.x);
          serverFormat.push(p.y);
          serverFormat.push(p.x2 || p.midpoint || 0.5);
          serverFormat.push(p.y2 || p.sharpness || 0.5);
        });
        dispatch(
          actions.colors.storePiecewiseFunction(
            selectors.colors.getColorByArray(state),
            points,
            serverFormat
          )
        );
        if (gaussians) {
          dispatch(
            actions.colors.storeGuassians(
              selectors.colors.getColorByArray(state),
              gaussians
            )
          );
        }
        dispatch(actions.colors.pushPendingServerOpacityPoints());
      },

    };
  },
  () => {
    return {
      propertyChange: ({ changeSet, invalidatePipeline, owners }) => {
        dispatch(actions.proxies.applyChangeSet(changeSet, owners));
        if (invalidatePipeline) {
          dispatch(actions.proxies.fetchPipeline());
        }

        // Make sure we update the full proxy not just the edited properties
        if (owners) {
          owners.forEach((id) => dispatch(actions.proxies.fetchProxy(id)));
        }
      },
      fetchServerDirectory: (path) => {
        dispatch(actions.files.fetchServerDirectory(path));
      },
      deleteProxy: (id) => {
        dispatch(actions.proxies.deleteProxy(id));
      },
      storeActiveDirectory: (path) => {
        dispatch(actions.files.storeActiveDirectory(path));
      },
      openFiles: (files) => {
        dispatch(actions.proxies.openFiles(files));
        //dispatch(actions.ui.updateVisiblePanel(0));
      },
      colorBy: (
        representation,
        arrayLocation,
        arrayName,
        colorMode,
        vectorMode,
        vectorComponent,
        rescale,
      ) => {
        dispatch(
          actions.colors.applyColorBy(
            representation,
            colorMode,
            arrayLocation,
            arrayName,
            vectorComponent,
            vectorMode,
            rescale
          )
        );
      },
    };
  }
)(FileBrowser);
