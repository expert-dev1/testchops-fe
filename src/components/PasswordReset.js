import React, {useEffect, useState} from "react";
import LoginPageCommon from "./LoginPageCommon";
import {Link} from "react-router-dom";
import {Button, Col, Row, TextInput} from "react-materialize";
import {EMAIL_REGEX, errorToast, successToast} from "../api/Util";
import {axiosClient} from "../api/httpClient";

export default () => {

    const [email, setEmail] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        return () => {
            setEmail('');
            setShowInstructions(false);
            setLoading(false);
        };
    }, []);

    function validateForm() {
        return EMAIL_REGEX.test(email);
    }

    function handleSubmit() {
        setLoading(true);
        axiosClient.post('/api/user/password-reset', { email })
            .then(() => {
                successToast('Password reset successful');
                setShowInstructions(true);
            })
            .catch((err) => {
                console.error(err);
                errorToast('Something went wrong, please try again');
            }).finally(() => setLoading(false));
    }

    return (
        <LoginPageCommon>
            <h5>Welcome Back<br/>Pleasure To See You Again</h5>

            <div style={{width: "80%", maxWidth: "400px", margin: "auto"}}>
                <div className="left-align" style={{width: "80%", margin: "auto"}}>
                    <h4>Reset Password</h4>
                    <p>Or, <Link to='/login'>click here to sign in</Link></p>
                </div>

                <Row>
                    <TextInput s={12}
                               id="email"
                               inputClassName="border-text-box"
                               placeholder="Email"
                               email validate autoFocus
                               value={email}
                               onChange={e => setEmail(e.target.value)} />
                </Row>
                <Row className="center-align">
                    <Col s={12} style={{padding: 0}}>
                        <Button className="btn-primary round-button" disabled={!validateForm() || loading}
                                onClick={handleSubmit}>Reset Password</Button>
                    </Col>
                </Row>
                {
                    showInstructions &&
                    <Row className="center-align">
                        <Col s={12}>
                            <p className="round-button green">We've reset your password and set an email containing further instructions</p>
                        </Col>
                    </Row>
                }
            </div>
        </LoginPageCommon>
    );
}
