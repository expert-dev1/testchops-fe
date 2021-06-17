import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Redirect} from "react-router-dom";
import {ProgressBar} from "react-materialize";

export default function(ComposedComponent) {

    class RequireAuth extends Component {

        componentDidMount() {
            if(!this.props.auth.loggedIn) {
                this.props.history.push('/login');
                return;
            }

            let user = this.props.auth?.loggedInUser;

            if((user?.is_temporary_password || !user?.is_profile_completed) && this.props.location.pathname !== 'profile') {
                this.props.history.push('/profile');
            }
        }

        componentDidUpdate(nextProps) {
            if(!nextProps.auth.loggedIn) {
                this.props.history.push('/login');
                return;
            }

            let user = nextProps.auth?.loggedInUser;

            if((user?.is_temporary_password || !user?.is_profile_completed) && this.props.location.pathname !== '/profile') {
                this.props.history.push('/profile');
            }
        }

        render() {
            if(this.props.auth.loading) {
                return (
                    <ProgressBar/>
                );
            } else if(this.props.auth.loggedIn === false) {
                return <Redirect to="/login"/>
            }
            return <ComposedComponent {...this.props} />
        }
    }

    function mapStateToProps({auth}) {
        return { auth };
    }

    return connect(mapStateToProps, actions)(RequireAuth);
}
