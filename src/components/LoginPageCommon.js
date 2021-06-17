import React from 'react';
import {Col, Row} from "react-materialize";
import Logo from "./img/vidchops-black.png";
import YTHelper from "./img/yt-helper.png"

export default ({ children }) => {
    return (
        <Row style={{ marginBottom: 0 }}>
            <Col l={8} className="loginPaneLeft center">
                <div style={{width: "80%", verticalAlign: "middle", margin: "auto", padding: "20px"}}>
                    <img style={{margin: "auto", width: "250px", borderRadius: "10px"}} src={Logo} alt="Vidchops"/>
                    {children[0] || <h5>Welcome Back<br/>Pleasure To See You Again</h5>}
                    <a href="https://vidchops.com/yt-helper/" target="_blank" rel="noopener noreferrer">
                        <img style={{margin: "auto", marginTop: "48px", width: "250px", borderRadius: "10px"}} src={YTHelper} alt="YouTube Helper"/>
                        <h5>A Completely<br/>Done For You Service<br/>For YouTubers.</h5>
                    </a>
                </div>
            </Col>
            <Col l={4} className="loginPaneRight center-align">
                { children[1] }
            </Col>
        </Row>
    );
}
