import React from 'react';
import PropTypes from 'prop-types';

import FileBrowserWidget from 'paraviewweb/src/React/Widgets/FileBrowserWidget';
import style from 'PVWStyle/ReactWidgets/FileBrowserWidget.mcss';

import { connect } from 'react-redux';
import { selectors, actions, dispatch } from '../../../redux';
import { getActiveSourceId } from '../../../redux/selectors/proxies';

// ----------------------------------------------------------------------------

export class FileBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.processAction = this.processAction.bind(this);
    //this.props.openFiles('C3N-01752_CT.nrrd');
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


  setRepresentation(name) {
    console.log(name);
  }

  processAction(e, action, name, files) {
    if (!e.target.checked) {
      this.props.deleteProxy(e.target.dataset.id);
      return
    }
    this[action](name, files);
  }

  getSourceDetails(label, pipeline) {

    // data props   where lablel - fileid's
    var d = this.props.data.filter(function (item) { return item.file_ids == label; });
    if (d.length === 0) {
      return { source_id: 0, is_checked: false, rep_id: 0 }
    }
    var p = pipeline.filter(function (source) { return source.name == d[0].source_name; });
    if (p.length === 0) {
      return { source_id: 0, is_checked: false, rep_id: 0 }
    } else {
      return { source_id: p[0].id, is_checked: true, rep: p[0].rep }
    }
  }

  render() {
    if (!this.props.visible || !this.props.fileListing) {
      return null;
    }

    this.props.list = [];

    this.props.fileListing.groups.map((item, index) => {
      var details = this.getSourceDetails(item.label, this.props.pipeline.sources);
      this.props.list.push({
        item: item, index: index, action: "group",
        source_id: details.source_id,
        is_checked: details.is_checked,
        rep: details.rep
      });
    });

    this.props.fileListing.files.map((item, index) => {
      var details = this.getSourceDetails(item, this.props.pipeline.sources);
      this.props.list.push({
        item: item, index: index, action: "file",
        source_id: details.source_id,
        is_checked: details.is_checked,
        rep: details.rep
      });
    });

    this.props.pipeline.sources.map((item, index) => {
      debugger;
      var rep = item.rep;
      var sourceId = item.id;
      var viewId = this.props.pipeline.view;
      var d = this.props.data.filter(function (s) { return s.source_name == item.name; });
      if (d.length != 0) {
        if (d[0].file_ids === 'C3N-01752_CT.nrrd') {
          const changeToPush = [];
          const owners = [];
          changeToPush.push({ id: rep, name: 'Representation', value: 'Volume' });
          owners[0] = sourceId;
          owners[1] = rep;
          owners[2] = viewId;
          this.props.propertyChange({ changeSet: changeToPush, owners });
          this.props.colorBy(rep, "POINTS", "ImageFile", "array", "Magnitude", 0, false)
        }
      }
    });

    return (
      <>
        {/* <FileBrowserWidget
          className={this.props.className}
          path={this.props.fileListing.path}
          directories={this.props.fileListing.dirs}
          groups={this.props.fileListing.groups}
          files={this.props.fileListing.files}
          onAction={this.processAction}
        /> */}
        <div>
          {/* {this.props.fileListing.groups.map((item, index) => (
            <ul key={index} style={{ listStyleType: "none", margin: "0px", padding: "4px", display: "flex", alignItems: "center" }}>
              <input type="checkbox" style={{ marginRight: "10px" }} checked={false} onClick={() => this.processAction("group", item, item.files)} />
              <i className={style.groupIcon} />
              <li><p style={{ margin: "0px" }}>{item.label}</p></li>
            </ul>
          ))}
          {this.props.fileListing.files.map((item, index) => (
            <ul key={index} style={{ listStyleType: "none", margin: "0px", padding: "4px", display: "flex", alignItems: "center" }}>
              <input type="checkbox" style={{ marginRight: "10px" }} checked={false} onClick={() => this.processAction("file", item, null)} />
              <i className={style.fileIcon} />
              <li><p style={{ margin: "0px" }}>{item}</p></li>
            </ul>
          ))} */}
          {this.props.list.map((i, index) => (
            <ul key={index} style={{ listStyleType: "none", margin: "0px", padding: "4px", display: "flex", alignItems: "center" }}>
              <input type="checkbox" style={{ marginRight: "10px" }} data-id={i.source_id} checked={i.is_checked} onClick={(e) => this.processAction(e, i.action, i.action === "group" ? i.item.label : i.item, i.action === "group" ? i.item.files : null)} />
              <i className={i.action === "group" ? style.groupIcon : style.fileIcon} />
              <li><p style={{ margin: "0px" }}>{i.action === "group" ? i.item.label : i.item}</p></li>
              {/* <li>{i.action === "group"? i.item.label:i.item}</li> */}
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
  data: PropTypes.array,
  list: PropTypes.array,
  deleteProxy: PropTypes.func.isRequired,
  propertyChange: PropTypes.func.isRequired,
  colorBy: PropTypes.func.isRequired,
};

FileBrowser.defaultProps = {
  visible: true,
  className: '',
  fileListing: undefined,
  pipeline: undefined,
  list: [],
  data: [{
    "source_name": "C3N01752_CT_LS_*",
    "file_ids": "C3N01752_CT_LS_*.stl",
    "rep_settings": "Surface",
    "color_settings": "Solid",
    "type": "group"
  },
  {
    "source_name": "C3N-01752_CT.nr*",
    "file_ids": "C3N-01752_CT.nrrd",
    "rep_settings": "Volume",
    "color_settings": "Image File",
    "type": "file"
  }]
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
