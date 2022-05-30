import React from 'react';
import PropTypes from 'prop-types';

import FileBrowserWidget from 'paraviewweb/src/React/Widgets/FileBrowserWidget';

import { connect } from 'react-redux';
import { selectors, actions, dispatch } from '../../../redux';

// ----------------------------------------------------------------------------

export class FileBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.processAction = this.processAction.bind(this);
    // this.props.openFiles('C3N-01752_CT.nrrd'); 
    this.props.openFiles({ fullPath: 'C3N-01752_CT.nrrd', fileName: this.props.pipeline });
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
    const basePath = [].concat(this.props.activePath.split('/'));
    basePath.shift(); // Remove the front 'Home'
    const fullPathFiles = files.map((f) => [].concat(basePath, f).join('/'));
    this.props.openFiles({ fullPath: fullPathFiles, fileName: this.props.pipeline });
  }

  file(name) {
    const pathList = [].concat(this.props.activePath.split('/'), name);
    pathList.shift(); // Remove the front 'Home'
    const fullPath = pathList.join('/');
    // this.props.openFiles(fullPath);      
    this.props.openFiles({ fullPath: fullPath, fileName: this.props.pipeline });
  }

  processAction(action, name, files) {
    // let fitlerString = '';
    // switch(name) {
    //   case 'C3N-01752_CT.nrrd':
    //     fitlerString = 'C3N-01752_CT.nr*'
    //     break;
    //   default:
    //     fitlerString = 'C3N01752_CT_LS_*';        
    // }
    // const source = this.props.pipeline.sources.filter(function (el) {
    //   return el.name === fitlerString;
    // });
    // if(source != null){
    //   dispatch(actions.proxies.deleteProxy(source[0].id));
    // }
    this[action](name, files);
    console.log('action name files', this[action](name, files))

  }

  render() {
    if (!this.props.visible || !this.props.fileListing) {
      return null;
    }
    var result=[]
    var group=[]

    if(this.props.pipeline.fileName != undefined){
      this.props.fileListing.groups.map((item2)=>{
        this.props.pipeline.fileName.map((item)=>{
          if(item==item2.label ){
            let data={
              name:item2.label,
              enable:true,
              file:item2.files
            }
            group.push(data)
          }
          else{
            let data={
              name:item2.label,
              enable:false,
              file:item2.files
            }
            group.push(data)
          }
        })
      })
    }
    else{
      this.props.fileListing.groups.map((item)=>{
        let data={
          name:item.label,
          enable:false,
          file:item.files
        }
        group.push(data)
      })
    }
    let groupData = [...new Map(group.map(item => [item.name, item])).values()]
    this.props.groupList=groupData

    if(this.props.pipeline.fileName != undefined){
      this.props.fileListing.files.map((item2)=>{
        this.props.pipeline.fileName.map((item)=>{
          if(item==item2 ){
            let data={
              name:item2,
              enable:true
            }
            result.push(data)
          }
          else{
            let data={
              name:item2,
              enable:false
            }
            result.push(data)
          }
        })
      })
    }
    else{
      this.props.fileListing.files.map((item)=>{
        let data={
          name:item,
          enable:false
        }
        result.push(data)
      })
    }
    let fileData = [...new Map(result.map(item => [item.name, item])).values()]
    this.props.fileList=fileData

    console.log('file list',this.props.fileList)
            
    console.log('files listing data', this.props.fileListing)
    console.log('pipeline source', this.props.pipeline)
    return (
      <>
        <FileBrowserWidget
          className={this.props.className}
          path={this.props.fileListing.path}
          directories={this.props.fileListing.dirs}
          groups={this.props.fileListing.groups}
          files={this.props.fileListing.files}
          onAction={this.processAction}
          data={this.props.pipeline}
        />
        <div>
          {this.props.groupList.map((item, index) => (
            <ul key={index} style={{ listStyleType: "none", margin: "0px", padding: "4px", display: "flex", alignItems: "center" }}>
              <input type="checkbox" style={{ marginRight: "10px" }} checked={item.enable} onClick={()=>this.processAction("group",item.name,item.file)}/>
              <li><p style={{ margin: "0px" }}>{item.name}</p></li>
            </ul>
          ))}
          {this.props.fileList.map((item, index) => (
            <ul key={index} style={{ listStyleType: "none", margin: "0px", padding: "4px", display: "flex", alignItems: "center" }}>
              <input type="checkbox" style={{ marginRight: "10px" }} checked={item.enable} onClick={()=>this.processAction("file",item.name,null)}/>
              <li><p style={{ margin: "0px" }}>{item.name}</p></li>
            </ul>
          ))}
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

  fetchServerDirectory: PropTypes.func.isRequired,
  storeActiveDirectory: PropTypes.func.isRequired,
  openFiles: PropTypes.func.isRequired,
  fileList:PropTypes.array,
  groupList:PropTypes.array
};

FileBrowser.defaultProps = {
  visible: true,
  className: '',
  fileListing: undefined,
  pipeline: undefined,
  fileList:[],
  groupList:[]
};

// Binding --------------------------------------------------------------------
/* eslint-disable arrow-body-style */

export default connect(
  (state) => {
    return {
      fileListing: selectors.files.getFileListing(state),
      activePath: selectors.files.getActivePath(state),
      pipeline: selectors.proxies.getPipeline(state),
    };
  },
  () => {
    return {
      fetchServerDirectory: (path) => {
        dispatch(actions.files.fetchServerDirectory(path));
      },
      storeActiveDirectory: (path) => {
        dispatch(actions.files.storeActiveDirectory(path));
      },
      openFiles: (files) => {
        dispatch(actions.proxies.openFiles(files));
        // dispatch(actions.ui.updateVisiblePanel(0));
      },
    };
  }
)(FileBrowser);
