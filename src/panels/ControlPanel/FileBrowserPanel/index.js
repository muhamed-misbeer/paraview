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
    this.props.openFiles('C3N-01752_CT.nrrd'); 
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
    this.props.openFiles(fullPathFiles);
  }

  file(name) {
    const pathList = [].concat(this.props.activePath.split('/'), name);
    pathList.shift(); // Remove the front 'Home'
    const fullPath = pathList.join('/');
    this.props.openFiles(fullPath);      
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
    
  }

  render() {
    if (!this.props.visible || !this.props.fileListing) {
      return null;
    }

    console.log(this.props.pipeline.sources)

    return (
      <FileBrowserWidget
        className={this.props.className}
        path={this.props.fileListing.path}
        directories={this.props.fileListing.dirs}
        groups={this.props.fileListing.groups}
        files={this.props.fileListing.files}
        onAction={this.processAction}
      />
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
};

FileBrowser.defaultProps = {
  visible: true,
  className: '',
  fileListing: undefined,
  pipeline: undefined,
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
        dispatch(actions.ui.updateVisiblePanel(0));
      },    
    };
  }
)(FileBrowser);
