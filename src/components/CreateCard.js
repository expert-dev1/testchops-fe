import React, {useEffect, useState} from "react";
import {Button, Checkbox, Col, Icon, Modal, Select, Textarea, TextInput} from "react-materialize";
import {connect} from "react-redux";
import * as actions from '../actions';
import * as _ from 'lodash';
import {errorToast, infoToast, isAdmin, resize, successToast, uploadMedia} from "../api/Util";
import {axiosClient} from "../api/httpClient";
import VoiceRecorder from "./VoiceRecorder";

const INITIAL_STATE = {
    client_id: null,
    card_title: "",
    dropbox_link: "",
    youtube_aspect_ratio: "",
    video_purpose: "",
    additional_info: "",
    special_instructions: "",
    video_thumb_desc: "",
    video_thumb_ref: [""],
    video_optimization_desc: "",
    affiliate_links: [""],
    subtitles: false,
    youtube_helper: false,
    repurpose_additional_info: "",
};

export default connect(mapStateToProps, actions)((props) => {

    const [repurpose, setRepurpose] = useState(false);
    const [repurposeRatios, setRepurposeRatios] = useState(0);
    const [repurposeSq, setRepurposeSq] = useState(false);
    const [repurpose916, setRepurpose916] = useState(false);
    const [repurpose45, setRepurpose45] = useState(false);
    const [repurposeOther, setRepurposeOther] = useState(false);
    const [repurposeAspect, setRepurposeAspect] = useState("");
    const [headlineRepurpose, setHeadlineRepurpose] = useState("");
    const [headlineRepurposeCheck, setHeadlineRepurposeCheck] = useState(false);
    const [state, setState] = useState(INITIAL_STATE);
    const [voiceBlob, setVoiceBlob] = useState(new Blob([]));
    const [error, setError] = useState(false);


    useEffect(() => {
        setState(prevState => ({...prevState, client_id: props.me.client_id}));

        if (isAdmin(props.me) && props.users.customers === undefined && !props.users.loadingCustomers) {
            props.fetchAllCustomers();
        }
    }, [props, props.me.client_id]);

    function onChange(e, index) {
        debugger;
        let name = e.target.name;
        let value = e.target.value;
        if(name === 'card_title'){
            setError(false);
        }

        
        if(e.target.type === 'checkbox') {
            setState(prevState => ({...prevState, [name]: !prevState[name]}));
        } else if(index != null && index >= 0) {
            let list = state[name];
            list = resize(list, index, "");
            list[index] = value;
            setState(prevState => ({...prevState, [name]: list}));
        } else {
            setState(prevState => ({...prevState, [name]: value}));
        }
    }

    function validateState() {
        return state.card_title !== "" && state.dropbox_link !== "" && state.youtube_aspect_ratio !== "" && state.video_purpose !== "";
    }

    function makeSelectCustomer() {
        return [
            <Col s={12} key="label-select" className="label-column">
                <label>Request for</label>
            </Col>,
            <Select s={12} name="client_id"
                    icon={<Icon>person</Icon>}
                    id="create-for-customer"
                    value={`${props.me.client_id}`}
                    onChange={onChange}
                    key="select" >
                <option value={props.me.client_id}>
                    Me
                </option>
                {
                    _.map(props.users?.customers || [], (customer) => {
                        return (
                            <option value={customer.client_id} key={`select-customer-${customer.client_id}`}>
                                {customer.fullname}
                            </option>
                        );
                    })
                }
            </Select>,
        ];
    }

    function addThumbnailLink() {
        setState(prev => ({...prev, video_thumb_ref: [...prev.video_thumb_ref, ""]}));
    }

    function addAffiliateLink() {
        setState(prev => ({...prev, affiliate_links: [...prev.affiliate_links, ""]}));
    }

    function makeLinks(name, value, onRemove) {
        let links = Array(value.length - 1);
        for(let id = 1; id < value.length; id++) {
            links[id-1] = (
                <TextInput key={`txt_${name}-${id}`} s={12} name={name} type="url" validate onChange={e => onChange(e, id)} value={value[id]}
                   icon={<Button style={{marginRight: "10px"}} className="btn-danger" onClick={() => onRemove(id)}><Icon>remove</Icon></Button>} />
            );
        }
        return links;
    }

    function removeThumbnailLink(id) {
        let list = state.video_thumb_ref;
        list.splice(id, 1);
        setState(prev => ({...prev, video_thumb_ref: list}));
    }

    function removeAffiliateLink(id) {
        let list = state.affiliate_links;
        list.splice(id, 1);
        setState(prev => ({...prev, affiliate_links: list}));
    }

    function makeRepurposeRatioText() {
        let ratio = "";
        if(repurposeSq) {
            ratio += "1:1 Square Video,";
        }
        if(repurpose916) {
            ratio += "9:16 IGTV Vertical Video,";
        }
        if(repurpose45) {
            ratio += "4:5 In Feed Vertical Video,";
        }
        if(repurposeOther) {
            ratio += repurposeAspect;
        }
        return ratio;
    }

    async function createCard() {
        infoToast("Creating new request");
        let voiceNote = await uploadMedia(voiceBlob, props.me.client_id);

        let {youtube_helper, ...body} = state;
        let repurposeRatio = makeRepurposeRatioText();
        axiosClient.post("/api/card", { ...body, voice_note: voiceNote, repurpose_aspect: repurposeRatio,
            repurpose_headline: headlineRepurpose})
            .then(() => {
                successToast("New request created");
                props.fetchCards();
                setState(INITIAL_STATE);
                props.onClose();
            }).catch(err => {
                debugger;
                errorToast(err?.response?.data?.message);
                setError(true)
                console.error(err);
            });
    }

    return (
        <Modal
            actions={[
                <Button key="cancel-button" modal="close" flat><Icon right>close</Icon> Cancel</Button>,
                <Button key="add-button" disabled={!validateState()} onClick={createCard} className="btn-primary"><Icon right>library_add</Icon> Create</Button>
            ]}
            header="New Video Request"
            id="create-card-modal"
            open={props.isOpen}
            style={{height: "70vh"}}
            options={{
                dismissible: true,
                startingTop: '10%',
                endingTop: '10%',
                onCloseEnd: props.onClose,
                opacity: 0.5,
                preventScrolling: true,
            }}
        >
            {isAdmin(props.me) ?
                makeSelectCustomer()
                : ""
            }
            <Col s={12} className="label-column">
                <label>What title should we use for this video? *</label>
            </Col>
            <TextInput id="txt_card_title"  s={12} className= {error ? 'error' : ''} icon="title" name="card_title" placeholder="Title" class="validate" onChange={onChange} value={state.card_title}/>
            <Col s={12} className="label-column">
                <label>What is the Dropbox folder download link for raw video? *</label>
            </Col>
            <TextInput id="txt_dbx_link" s={12} icon="link" name="dropbox_link" type="url" validate placeholder="Dropbox Link" onChange={onChange} value={state.dropbox_link}/>
            <Col s={12} className="label-column">
                <label>Which format do you want your video in? *</label>
            </Col>
            <Select s={12} icon={<Icon>aspect_ratio</Icon>} id="aspect_ratio" name="youtube_aspect_ratio" onChange={onChange} value={state.youtube_aspect_ratio}>
                <option value="">{/**/}</option>
                <option value="Wide (16:9)">Wide (16:9)</option>
                <option value="Square (1:1)">Square (1:1)</option>
                <option value="Vertical (9:16)">Vertical (9:16)</option>
            </Select>
            <Col s={12} className="label-column">
                <label>What type of content is this order for? *</label>
            </Col>
            <Select s={12} icon={<Icon>switch_video</Icon>} id="select-video_purpose" name="video_purpose"
                    onChange={onChange} value={state.video_purpose}>
                <option value="">{/**/}</option>
                <option value="Social media/Youtube Content">Social media/Youtube Content</option>
                <option value="Advertising/Marketing">Advertising/Marketing</option>
                <option value="Internal organization usage">Internal organization usage</option>
                <option value="Podcast">Podcast</option>
                <option value="Wedding video">Wedding video</option>
                <option value="TV/Movie/Film">TV/Movie/Film</option>
            </Select>
            {
                props.isOpen &&
                [
                    <Col s={12} className="label-column" key="voice-col">
                        <label>[Optional] Add voice notes:&nbsp;&nbsp;&nbsp;</label>
                    </Col>,
                    <VoiceRecorder s={12} key="audio-recorder" onAudioRecorded={setVoiceBlob}
                                   audioUrl={state.voice_note}/>,
                ]
            }
            <Col s={12} className="label-column">
                <label>Anything else we should know about this video?</label>
            </Col>
            <Textarea s={12} icon={<Icon>short_text</Icon>} name="additional_info" placeholder="Additional Info" onChange={onChange} value={state.additional_info}/>
            <Col s={12} className="label-column">
                <label>Are there any special instructions for this video that are different than what we normally edit for you?</label>
            </Col>
            <Textarea s={12} icon={<Icon>short_text</Icon>} name="special_instructions" placeholder="Special Instructions" onChange={onChange} value={state.special_instructions}/>
            {
                (isAdmin(props.me) || props.me.has_youtube_helper) ?
                    <Col s={12}><Icon left>live_help</Icon>
                        <Checkbox name="youtube_helper" id="check-youtube-helper" label="Need youtube helper?" onChange={onChange} value="1" checked={state.youtube_helper}/>
                    </Col>
                    : null
            }
            {
                state.youtube_helper ? React.Children.toArray([
                    <Col s={12} className="label-column">
                        <label>Instructions about thumbnail</label>
                    </Col>,
                    <Textarea s={12} icon={<Icon>short_text</Icon>} name="video_thumb_desc"
                              placeholder="Instructions about thumbnail" onChange={onChange} value={state.video_thumb_desc}/>,
                    <Col s={12} className="label-column">
                        <label>Video Thumbnail Reference Links</label>
                    </Col>,
                    <TextInput s={12}
                               icon={<Button style={{marginRight: "10px"}} className="btn-primary"
                                             onClick={addThumbnailLink}><Icon>add</Icon></Button>}
                               name="video_thumb_ref" type="url" validate placeholder="Video Thumbnail Reference Links"
                               onChange={e => onChange(e, 0)} value={state.video_thumb_ref[0]}/>,
                    ...makeLinks("video_thumb_ref", state.video_thumb_ref, removeThumbnailLink),
                    <Col s={12} className="label-column">
                        <label>Instruction about video title and description</label>
                    </Col>,
                    <Textarea s={12} icon={<Icon>short_text</Icon>} name="video_optimization_desc"
                              onChange={onChange} value={state.video_optimization_desc}/>,
                    <Col s={12} className="label-column">
                        <label>Affiliate or Product Links</label>
                    </Col>,
                    <TextInput s={12}
                               icon={<Button style={{marginRight: "10px"}} className="btn-primary"
                                             onClick={addAffiliateLink}><Icon>add</Icon></Button>}
                               name="affiliate_links" type="url" validate placeholder="Affiliate or Product Links"
                               onChange={e => onChange(e, 0)} value={state.affiliate_links[0]}/>,
                    ...makeLinks("affiliate_links", state.affiliate_links, removeAffiliateLink),
                ]) : null
            }
            {
                (isAdmin(props.me) || props.me.has_subtitles) ?
                    <Col s={12}><Icon left>subtitles</Icon><Checkbox name="subtitles" id="check-subtitles" label="Add subtitles?" onChange={onChange} value="1" checked={state.subtitles}/></Col>
                    : null
            }
            <Col s={12}><Icon left>all_inclusive</Icon>
                <Checkbox id="check-repurpose" label="Do you want us to repurpose this video? " name="repurpose"
                          onChange={() => setRepurpose(prev => !prev)} value="1" checked={repurpose}/>
            </Col>
            {
                repurpose ? React.Children.toArray([
                    <Col s={12} className="label-column">
                        <label>Which size(s) do you want your video in? (Max 2) *</label>
                    </Col>,
                    <Col s={12} className="label-column">
                        <Checkbox label="Square (1:1)" name="1-1" onChange={() => onChangeRepurposeAspect(repurposeSq, setRepurposeSq)}
                                  value="Square (1:1)" checked={repurposeSq} id="1-1" disabled={!repurposeSq && repurposeRatios >= 2}/>
                    </Col>,
                    <Col s={12} className="label-column">
                        <Checkbox label="IGTV Vertical (9:16)" name="9-16" onChange={() => onChangeRepurposeAspect(repurpose916, setRepurpose916)}
                                  value="IGTV Vertical (9:16)" checked={repurpose916} id="9-16" disabled={!repurpose916 && repurposeRatios >= 2}/>
                    </Col>,
                    <Col s={12} className="label-column">
                        <Checkbox label="In Feed Vertical (4:5)" name="4-5" onChange={() => onChangeRepurposeAspect(repurpose45, setRepurpose45)}
                                  value="In Feed Vertical (4:5)" checked={repurpose45} id="4-5" disabled={!repurpose45 && repurposeRatios >= 2}/>
                    </Col>,
                    <Col s={12} className="label-column">
                        <Checkbox label="Other" name="other" onChange={() => onChangeRepurposeAspect(repurposeOther, setRepurposeOther)}
                                  value="Enter Custom size" checked={repurposeOther} id="other" disabled={!repurposeOther && repurposeRatios >= 2}/>
                    </Col>,
                    repurposeOther ?
                    <TextInput s={12} placeholder="Custom video size" value={repurposeAspect} icon="aspect_ratio"
                               onChange={e => setRepurposeAspect( e?.target?.value)}/> : null,
                    <br/>,
                    <Col s={12} className="label-column">
                        <Checkbox label="Do you want a headline on your video?"
                                  onChange={() => setHeadlineRepurposeCheck(!headlineRepurposeCheck)}
                                  value="1" checked={headlineRepurposeCheck} id="headline"/>
                    </Col>,
                    headlineRepurposeCheck ?
                        <TextInput s={12} placeholder="Custom headline" value={headlineRepurpose} icon="short_text"
                                   onChange={e => setHeadlineRepurpose( e?.target?.value)}/> : null,
                    <br/>,
                    <Col s={12} className="label-column">
                        <label>Do you have any other information or instructions for us?</label>
                    </Col>,
                    <Textarea s={12} icon={<Icon>short_text</Icon>} name="repurpose_additional_info"
                              onChange={onChange} value={state.repurpose_additional_info}/>,
                ]) : null
            }
        </Modal>
    );

    function onChangeRepurposeAspect(val, fn) {
        if(val) {
            fn(!val);
            setRepurposeRatios(repurposeRatios - 1);
        } else if(repurposeRatios < 2) {
            fn(!val);
            setRepurposeRatios(repurposeRatios + 1);
        }
    }
});

function mapStateToProps({users}) {
    return {users};
}
