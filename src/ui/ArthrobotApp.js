/** @jsx React.DOM */

var ActiveState = require('react-router').ActiveState;
var Link = require('react-router').Link;
var Parse = require('parse').Parse;
var React = require('react');
var gravatar = require('gravatar');

var Navbar = require('react-bootstrap').Navbar;
var Nav = require('react-bootstrap').Nav;
var NavItem = require('react-bootstrap').NavItem;

var Tab = require('./Tab');

require('./ArthrobotApp.css')

var ArthrobotApp = React.createClass({

  mixins: [ActiveState],

  render: function() {
    var navbar = [];
    var user = Parse.User.current();
    if (user) {
      navbar = [
        <Link key="1" to="profile" params={{username:user.get('username')}}><img className="gravatar" src={gravatar.url(user.get('email'))} /></Link>,
        <Tab key="2" to="logout">Logout</Tab>
      ];
    } else {
      navbar = [
        <Tab key="1" to="signup"><strong>Sign Up</strong></Tab>,
        <Tab key="2" to="login">Log In</Tab>
      ];
    }
    var brand = <Link to="landing">Arthrobots</Link>;
    return (
      <div className="container ArthrobotApp">
        <Navbar brand={brand} fluid={true} className="navbar-inverse">
          <Nav>
            <Tab to="landing">Home</Tab>
            {user ? <Tab to="worlds">Worlds</Tab> : null}
          </Nav>
          <Nav className="navbar-right">
            {navbar}
          </Nav>
        </Navbar>

        <div className="row">
          <div className="col-md-12 app-content">
            <this.props.activeRouteHandler/>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ArthrobotApp;