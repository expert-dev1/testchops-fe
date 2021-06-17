import React, {useEffect, useState} from "react";
import MicRecorder from 'mic-recorder-to-mp3';
import {Button, Col, Icon} from "react-materialize";
import {errorToast} from "../api/Util";
import Timer from "react-compound-timer";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });
const INITIAL_STATE = {
    isRecording: false,
    blobURL: '',
    isBlocked: false,
    mediaLoaded: false,
};

let stream = null;

function stopBothVideoAndAudio(stream) {
    stream.getTracks().forEach(function(track) {
        if (track.readyState === 'live') {
            track.stop();
        }
    });
}

export default ({s, m, l, onAudioRecorded, audioUrl}) => {

    const [state, setState] = useState(INITIAL_STATE);

    useEffect(() => {
        const loadMedia = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({audio: true});
                console.log('Permission Granted');
                setState(prev => ({...prev, isBlocked: false, mediaLoaded: true}));
            } catch (err) {
                console.error('Permission Denied', err);
                setState(prev => ({...prev, isBlocked: true, mediaLoaded: false}));
            }
        };

        if(!state.mediaLoaded) {
            loadMedia().then(() => {});
        }

        if(audioUrl) {
            setState(prev => ({...prev, blobURL: audioUrl}));
        }

        return () => {
            if(stream) {
                stopBothVideoAndAudio(stream);
            }
        };
    }, [audioUrl, state.mediaLoaded]);

    function start() {
        if (state.isBlocked) {
            errorToast("Voice recording is disabled");
        } else {
            Mp3Recorder
                .start()
                .then(() => {
                    setState(prev => ({ ...prev, isRecording: true }));
                }).catch((e) => {
                    console.error(e);
                    errorToast("Something went wrong while recording");
                });
        }
    }

    function stop() {
        Mp3Recorder
            .stop()
            .getMp3()
            .then(([buffer, blob]) => {
                const blobURL = URL.createObjectURL(blob)
                setState(prev => ({ ...prev, blobURL, isRecording: false }));
                onAudioRecorded(blob);
            }).catch((e) => {
                console.error(e);
                errorToast("Something went wrong while recording");
            });
    }

    function clear() {
        Mp3Recorder
            .stop();
        setState(prev => ({...prev, blobURL: '', isRecording: false,}));
        onAudioRecorded(new Blob([]));
    }

    if(state.isBlocked) {
        return <Col s={s} m={m} l={l} className="center-align" style={{paddingTop: "1rem"}}>
            <Icon left>keyboard_voice</Icon><span className="red">Please enable Microphone access to record voice notes</span>
        </Col>
    }

    return (
        <Col s={s} m={m} l={l} className="center-align" style={{paddingTop: "1rem"}}>
            {
                state.isRecording ?
                <Timer>
                    <Timer.Minutes formatValue={val => `${`${val}`.padStart(2, "0")}:`}/>
                    <Timer.Seconds formatValue={val => `${`${val}`.padStart(2, "0")}`}/>
                </Timer> : ""
            }
            <Button onClick={start} disabled={state.isRecording} icon={<Icon left>fiber_manual_record</Icon>} className="btn-primary">Record</Button>
            <Button onClick={stop} disabled={!state.isRecording} icon={<Icon left>stop</Icon>} flat>Stop</Button>
            {
                state.blobURL && state.blobURL !== '' ?
                    [
                        <Button onClick={clear} key="btn-clear" icon={<Icon left>clear</Icon>} flat>clear</Button>,
                        <br key="newline"/>,
                        <audio src={state.blobURL} controls="controls" key="audio-preview" />
                    ]
                    : ""
            }
        </Col>
    );
}
