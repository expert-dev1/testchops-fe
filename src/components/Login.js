import React, {useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import * as actions from "../actions";
import {Button, Checkbox, Col, ProgressBar, Row, TextInput} from "react-materialize";
import {axiosClient, setAuthToken} from "../api/httpClient";
import {errorToast} from "../api/Util";
import {Link, Redirect} from "react-router-dom";
import LoginPageCommon from "./LoginPageCommon";

const INITIAL_STATE = { useremail: "", password: "", loginProgress: false };

export default connect(mapStateToProps, actions)((props) => {
    const [{useremail, password, loginProgress}, setState] = useState(INITIAL_STATE);
    const emailField = useRef();
    const [rememberMe, setRememberMe] = useState(true);

    useEffect(() => {
        let interval = setInterval(() => {
            if (emailField.current) {
                setState(prev => ({...prev, useremail: emailField.current.value}));
                clearInterval(interval);
            }
        }, 100);
    });

    useEffect(() => {
        const credentials = JSON.parse(localStorage.getItem('access') || '{}');
        if(credentials) {
            setState(prev => ({...prev, useremail: credentials.useremail || '', password: credentials.password || ''}));
        }
    }, []);

    function validateForm() {
        return useremail?.length > 0 && password?.length > 0;
    }

    function setLoginProgress(value) {
        setState(prev => ({...prev, loginProgress: value}));
    }

    async function handleSubmit() {
        if(loginProgress) {
            return;
        }
        setLoginProgress(true);
        try {
            let response = await axiosClient.post("/api/login", {useremail, password});
            setAuthToken(`Bearer ${response.data.access_token}`);
            props.fetchUser();
            if(rememberMe) {
                localStorage.setItem('access', JSON.stringify({ useremail, password }));
            } else {
                localStorage.removeItem('access');
            }
        } catch (e) {
            if(e.response.status === 401) {
                errorToast("Incorrect login credentials");
                localStorage.removeItem('access');
            } else {
                errorToast("Unable to login: " + e.message);
                console.debug(e);
            }

            setLoginProgress(false);
        }
    }

    function onChange(e) {
        let name = e.target.name;
        let value = e.target.value;
        setState(prev => ({...prev, [name]: value}));
    }

    let auth = props.auth;
    if (auth.loggedIn) {
        return <Redirect to="/"/>;
    }

    return (
        <LoginPageCommon>
            <h5>Welcome Back<br/>Pleasure To See You Again</h5>
            <div style={{width: "80%", maxWidth: "400px", margin: "auto"}}>
                <div className="left-align" style={{width: "80%", margin: "auto"}}>
                    <h4>Sign In</h4>
                </div>

                <Row>
                    <TextInput s={12}
                               ref={emailField}
                               id="useremail"
                               inputClassName="border-text-box"
                               name="useremail"
                               placeholder="Email"
                               email validate autoFocus
                               value={useremail}
                               onChange={onChange}/>
                    <TextInput s={12}
                               id="password"
                               inputClassName="border-text-box"
                               name="password"
                               placeholder="Password"
                               password
                               value={password}
                               onChange={onChange}/>
                    <Col s={12}>
                        <Checkbox value="1" label="Remember me" checked={rememberMe}
                                  onChange={() => setRememberMe(!rememberMe)}/>
                    </Col>
                </Row>
                {
                    props.auth.loading || loginProgress ? <ProgressBar/> : ""
                }
                <Row className="center-align">
                    <Col s={12} style={{padding: 0}}>
                        <Button className="btn-primary round-button" disabled={!validateForm() || loginProgress}
                                onClick={handleSubmit}>Login</Button>
                    </Col>
                    <Col s={12} style={{marginTop: "2vh"}}>
                        <Link to="/password-reset">Forgot password?</Link>
                    </Col>
                </Row>
            </div>
        </LoginPageCommon>
    );
});

function mapStateToProps({auth, settings}) {
    return {auth, settings};
}
