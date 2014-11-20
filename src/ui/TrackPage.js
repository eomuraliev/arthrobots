/** @jsx React.DOM */
var ActiveState = require('react-router').ActiveState;
var Button = require('react-bootstrap').Button;
var Glyphicon = require('react-bootstrap').Glyphicon;
var Link = require('react-router').Link;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;
var Modal = require('react-bootstrap').Modal;
var ModalTrigger = require('react-bootstrap').ModalTrigger;
var Nav = require('react-bootstrap').Nav;
var Navbar = require('react-bootstrap').Navbar;
var Navigation = require('react-router').Navigation;
var NavItem = require('react-bootstrap').NavItem;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;
var Parse = require('parse').Parse;
var React = require('react');

var Tab = require('./Tab');
var Markdown = require('./Markdown');
var WorldCanvas = require('./WorldCanvas');
var ProgramEditor = require('./ProgramEditor');
var TrackBadge = require('./TrackBadge');
var LoadingBlock = require('./LoadingBlock');

var WorldModel = require('../models/WorldModel');
var TrackModel = require('../models/TrackModel');
var ProgramModel = require('../models/ProgramModel');

require('./TrackPage.css');
var TrackPage = React.createClass({

  mixins: [Navigation, ActiveState],

  getInitialState: function() {
    return {
      trackModel: null,
      worldModels: [],
      programModels: [],
      isLoading: true,
    };
  },

  getCurrentWorld: function() {
    var currentWorld = null;
    this.state.worldModels.every(function(world) {
      if (this.props.query.worldId == world.id) {
        currentWorld = world;
        return false;
      }
      return true;
    }.bind(this));
    return currentWorld;
  },

  loadTrackAndWorlds: function() {
    var query = new Parse.Query(TrackModel);
    this.setState({isLoading: true});
    query.get(this.props.params.trackId, {
      success: function(trackModel) {
        this.setState({
          trackModel:trackModel
        });

        var query = new Parse.Query(WorldModel);
        query.equalTo('track', trackModel);
        query.equalTo('public', true);
        query.ascending('order');
        query.find({
          success: function(worldModels) {
            this.setState({
              worldModels: worldModels,
              isLoading: false
            });

            var programQuery = new Parse.Query(ProgramModel);
            programQuery.equalTo('owner', Parse.User.current());
            programQuery.matchesQuery('world', query);
            programQuery.find({
              success: function(programs) {
                this.setState({
                  programModels: programs
                });
                var transitionedToWorld = false;
                this.state.worldModels.every(function(world, worldIndex) {
                  var worldIsFinished = false;
                  programs.every(function(program) {
                    if (program.get('world').id == world.id && program.get('finished')) {
                      worldIsFinished = true;
                      return false;
                    }
                    return true;
                  }.bind(this));
                  if (!worldIsFinished && !this.props.query.worldId) {
                    this.transitionTo('track', {trackId:this.props.params.trackId}, {worldId:world.id})
                    transitionedToWorld = true;
                    return false;
                  }
                  return true;
                }.bind(this));
                if (!transitionedToWorld && !this.props.query.worldId) {
                  this.transitionTo('track', {trackId:this.props.params.trackId}, {worldId:this.state.worldModels[0].id});
                }
              }.bind(this)
            });

          }.bind(this)
        });
      }.bind(this),
      error: function() {
        alert("failed to fetch track:"+error.code+" "+error.message);
      }.bind(this)
    })
  },

  componentDidMount: function() {
    this.loadTrackAndWorlds();
  },

  componentDidUpdate: function() {
    if (this.refs.programEditor) {
      // debugger;
      $(this.refs.programEditor.getDOMNode()).affix({
        offset: {
          top: $(this.refs.programEditor.getDOMNode()).offset().top - 10,
          bottom: 0
        }
      });
    }
  },

  handleContinue: function(index) {
    var currentWorldIndex = null;
    this.state.worldModels.every(function(world, index) {
      if (this.props.query.worldId == world.id) {
        currentWorldIndex = index;
        return false;
      }
      return true;
    }.bind(this));
    var nextWorld = this.state.worldModels[currentWorldIndex + 1];
    this.transitionTo('track', {trackId:this.props.params.trackId}, {worldId:nextWorld.id});
  },

  handleFinished: function(world, program) {
    this.setState({programModels:this.state.programModels.map(function(programModel){
      // swap out the old program for the new program
      if (programModel.id == program.id) {
        return program;
      }
      return programModel;
    })});
  },

  render: function() {
    if (this.state.isLoading || !this.getCurrentWorld()) {
      return <LoadingBlock/>;
    } else if (this.state.worldModels.length == 0) {
      return <div>There are no worlds here yet</div>;
    }
    var worldList = this.state.worldModels.map(function(world, index){
      var isActive = world.id == this.getCurrentWorld().id;
      var isFinished = false;
      this.state.programModels.forEach(function(program) {
        if (program.get('world').id == world.id && program.get('finished')) {
          isFinished = true;
        }
      }.bind(this));
      return (
        <li
          key={world.id}
          className={(isActive ? "active":"") + (isFinished ? " finished" : "")}>
          <OverlayTrigger placement="bottom" overlay={<Tooltip>{world.get('name')}</Tooltip>}>
            <Link to="track" params={{trackId:this.props.params.trackId}} query={{worldId:world.id}}>
              {isFinished ? <Glyphicon glyph="star"/> : <Glyphicon glyph="star-empty"/>}
            </Link>
          </OverlayTrigger>
        </li>
      );
    }.bind(this));

    return (
      <div className="TrackPage">
        <nav>
          <ul className="pagination">
            {worldList}
          </ul>
        </nav>
        <h3>{this.getCurrentWorld().get('name')} <TrackBadge track={this.state.trackModel}/></h3>
        <div className="row">
          <div className="col-md-5">
            <Markdown>{this.getCurrentWorld().get('description')}</Markdown>
          </div>
          <div className="col-md-7">
            <ProgramEditor
              ref="programEditor"
              worldModel={this.getCurrentWorld()}
              onContinue={this.handleContinue}
              onFinished={this.handleFinished.bind(this, this.getCurrentWorld())}
            />
          </div>
        </div>
      </div>
    );
  }
});

module.exports = TrackPage;