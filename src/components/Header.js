import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Link, NavLink} from "react-router-dom";
import * as actions from "../actions";
import M from 'materialize-css';
import {Divider, Dropdown, Icon, Navbar, NavItem} from "react-materialize";

import Logo from './img/vidchops-transparent.png';
import Augie from './img/augie_thumbnail.png';
import Profile from './img/profile.png';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import NotificationDropdown from "./NotificationDropdown";
import {ADMIN, CUSTOMER, QA_USER, TEAM_LEAD, YT_HELPER, YT_HELPER_LEAD} from "../api/Constants";


export default connect(mapStateToProps, actions)((props) => {
    const auth = props.auth;

    useEffect(() => {
        console.debug(M != null);
    }, []);

    useEffect(() => {
        if (auth.loggedIn && !auth.loggedInUser && auth.loading === false) {
            props.fetchUser();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.loggedIn, auth.loggedInUser]);

    function profile() {
        if (auth.loggedIn && auth.loggedInUser) {
            let fullName = auth.loggedInUser.firstname + " " + auth.loggedInUser.lastname;
            return (
                <Dropdown
                    id="profileDropdown"
                    options={{ coverTrigger: false }}
                    trigger={<a href="/#" className="center-align">
                        <div>
                            <img src={auth.loggedInUser.profile_img || Profile} className="profile-image hide-on-small-only" alt="Avatar"/>
                            <span style={{verticalAlign: "middle"}}>{fullName}</span>
                        </div>
                    </a>}
                >
                    <Link to={"/profile"}>
                        Profile
                    </Link>
                    <Divider />
                    <a href="/#" onClick={props.logout.bind(this)}>
                        Logout
                    </a>
                </Dropdown>
            );
        } else {
            return [
                <NavLink key="loginNav" to="/login">
                    Login
                </NavLink>,
                <NavLink key="signupNav" to="/signup">
                    Signup
                </NavLink>
            ];
        }
    }

    function userTypeOptions(user) {
        let clientType = (user && user.client_type) || '';
        switch(clientType) {
            case ADMIN:
                return adminHeaderLinks();
            case TEAM_LEAD:
            case YT_HELPER_LEAD:
                return teamLeadHeaderLinks();
            case QA_USER:
            case YT_HELPER:
                return qaHeaderLinks();
            case CUSTOMER:
                return customerHeaderLinks();
            default:
                return '';
        }
    }

    function adminHeaderLinks() {
        return [
            <NavLink key="usersNav" to="/users">
                <FontAwesomeIcon icon="user-tie"/>&nbsp;&nbsp;Users
            </NavLink>,
            <NavLink key="customersNav" to="/customers">
                <FontAwesomeIcon icon="users"/>&nbsp;&nbsp;Customers
            </NavLink>,
            <NavLink key="dashboardNav" to="/dashboard">
                <FontAwesomeIcon icon="chart-line"/>&nbsp;&nbsp;Dashboard
            </NavLink>,
            <NavLink key="archivedNav" to="/cards/archive">
                <FontAwesomeIcon icon="archive"/>&nbsp;&nbsp;Archived
            </NavLink>,
            <NavLink key="settingsNav" to="/settings">
                <FontAwesomeIcon icon="cogs"/>&nbsp;&nbsp;Portal Settings
            </NavLink>,
        ];
    }

    function teamLeadHeaderLinks() {
        return [
            <NavLink key="usersNav" to="/users">
                <FontAwesomeIcon icon="users"/>&nbsp;&nbsp;My Team
            </NavLink>,
            // <NavLink key="customersNav" to="/customers">
            //     <FontAwesomeIcon icon="users"/>&nbsp;&nbsp;My Customers
            // </NavLink>,
        ];
    }

    function qaHeaderLinks() {
        return [
            <NavLink key="customersNav" to="/customers">
                <FontAwesomeIcon icon="users"/>&nbsp;&nbsp;My Customers
            </NavLink>,
        ];
    }

    function customerHeaderLinks() {
        return (
            <NavItem key="supportNav" href="https://vidchops.activehosted.com/f/16">
                <FontAwesomeIcon icon="ticket-alt"/>&nbsp;&nbsp;Create Support Ticket
            </NavItem>
        );
    }

    return (
        auth?.loggedIn &&
        <Navbar
            alignLinks="right"
            brand={<a className="brand-logo" href={"/"}>
                <img src={Augie} alt="Augie" className="avatar hide-on-small-only" style={{width: "50px", height: "auto", margin: "5px", verticalAlign: "middle",}}/>
                <img src={Logo} alt="Vidchops" style={{margin: "5px", borderRadius: "5px", width: "auto", height: "36px", verticalAlign: "middle",}}/>
            </a>}
            id="headerNavbar"
            menuIcon={<Icon>menu</Icon>}
            options={{
                draggable: false,
                edge: 'left',
                inDuration: 250,
                outDuration: 200,
                preventScrolling: true
            }}
        >
            { userTypeOptions(auth?.loggedInUser) }
            { auth?.loggedIn && <NotificationDropdown me={auth?.loggedInUser}/> }
            { profile() }
        </Navbar>
    );
});

function mapStateToProps({auth}) {
    return {auth};
}
