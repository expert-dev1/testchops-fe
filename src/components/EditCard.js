import React, {useEffect, useState} from "react";
import {Button, Checkbox, Col, Icon, Modal, ProgressBar, Row, Select, Textarea, TextInput} from "react-materialize";
import {errorToast, infoToast, resize, successToast, uploadMedia} from "../api/Util";
import {axiosClient} from "../api/httpClient";
import ChatBox from "./ChatBox";
import VoiceRecorder from "./VoiceRecorder";

const INITIAL_STATE = {
    card_id: 0,
    card_title: "Edit Card",
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
    voice_note: "",
    repurpose_additional_info: "",
};

export default (props) => {

    const [repurpose, setRepurpose] = useState(false);
    const [repurposeAspect, setRepurposeAspect] = useState("");
    const [headlineRepurpose, setHeadlineRepurpose] = useState("");
    const [headlineRepurposeCheck, setHeadlineRepurposeCheck] = useState(false);
    const [state, setState] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [voiceBlob, setVoiceBlob] = useState(new Blob([]));

    useEffect(() => {
        if(props.isOpen) {
            loadCard().then(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.cardId, props.isOpen]);

    async function loadCard() {
        if (loading) {
            return;
        }

        setLoading(true);
        try {
            const {data} = await axiosClient.get('/api/card/' + props.cardId);
            setState({
                card_id: data.card_id,
                card_title: data.card_title,
                dropbox_link: data.dropbox_link,
                youtube_aspect_ratio: data.youtube_aspect_ratio,
                video_purpose: data.video_purpose,
                additional_info: data.additional_info || "",
                special_instructions: data.special_instructions || "",
                video_thumb_desc: data.video_thumb_desc || "",
                video_thumb_ref: data.video_thumb_ref.split('|'),
                video_optimization_desc: data.video_optimization_desc || "",
                affiliate_links: data.affiliate_links.split('|'),
                subtitles: data.subtitles,
                youtube_helper: false,
                voice_note: data.voice_note || '',
                repurpose_additional_info: data.repurpose_additional_info || '',
            });
            setRepurposeAspect(data.repurpose_aspect || '');
            setRepurpose(data.repurpose_aspect?.length > 0);
            setHeadlineRepurpose(data.repurpose_headline || '');
            setHeadlineRepurposeCheck(data.repurpose_headline?.length > 0);
        } catch (err) {
            errorToast(err?.data?.message || "Couldn't fetch card content");
            console.error(err);
        }
        setLoading(false);
    }

    function onChange(e, index) {
        let name = e.target.name;
        let value = e.target.value;

        if(e.target.type === 'checkbox') {
            setState(prevState => ({...prevState, [name]: !prevState[name] }));
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
        return state.card_title !== "" && state.dropbox_link !== "" && state.youtube_aspect_ratio !== ""
            && state.video_purpose !== "";
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

    async function updateCard() {
        infoToast("Updating card details");

        let voiceNote = await uploadMedia(voiceBlob, props.me.client_id);

        let {youtube_helper, ...body} = state;
        axiosClient.put("/api/card/" + state.card_id, {...body, voice_note: voiceNote || state.voice_note,
            repurpose_aspect: repurpose ? repurposeAspect : null, repurpose_headline: headlineRepurposeCheck ? headlineRepurpose : null})
            .then(() => {
                successToast("Card details updated");
                setState(INITIAL_STATE);
            }).catch(err => {
                errorToast("Unable to update card");
                console.error(err);
            });
    }

    return (
        <Modal
            actions={[
                <Button key="cancel-button" modal="close" flat><Icon right>close</Icon> Cancel</Button>,
                <Button key="save-button" disabled={!validateState()} modal="close" onClick={updateCard} className="btn-primary"><Icon right>save</Icon> Save</Button>
            ]}
            header={state.card_title}
            id="update-card-modal"
            open={props.isOpen}
            style={{height: "70vh", width: '80vh'}}
            options={{
                dismissible: true,
                startingTop: '10%',
                endingTop: '10%',
                onCloseEnd: props.onClose,
                opacity: 0.5,
                preventScrolling: true,
            }}
        >
            { loading && <ProgressBar/>}
            <Col s={12} className="label-column">
                <label>What title should we use for this video? *</label>
            </Col>
            <TextInput id="et_txt_card_title" s={12} icon="title" name="card_title" placeholder="Title" onChange={onChange} value={state.card_title}/>
            <Col s={12} className="label-column">
                <label>What is the Dropbox folder download link for raw video? *</label>
            </Col>
            <TextInput id="et_txt_dbx_link" s={12} icon="link" name="dropbox_link" type="url" validate placeholder="Dropbox Link" onChange={onChange} value={state.dropbox_link}/>
            <Col s={12} className="label-column">
                <label>Which format do you want your video in? *</label>
            </Col>
            <Select s={12} icon={<Icon>aspect_ratio</Icon>} id="et_aspect_ratio" name="youtube_aspect_ratio" onChange={onChange} value={state.youtube_aspect_ratio}>
                <option value="">{/**/}</option>
                <option value="Wide (16:9)">Wide (16:9)</option>
                <option value="Square (1:1)">Square (1:1)</option>
                <option value="Vertical (9:16)">Vertical (9:16)</option>
            </Select>
            <Col s={12} className="label-column">
                <label>What type of content is this order for? *</label>
            </Col>
            <Select s={12} icon={<Icon>switch_video</Icon>} id="et_select-video_purpose" name="video_purpose"
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
                props.isOpen ? [
                        <Col s={12} className="label-column" key="voice-col">
                            <label>[Optional] Add voice notes:&nbsp;&nbsp;&nbsp;</label>
                        </Col>,
                        <VoiceRecorder s={12} key="audio-recorder" onAudioRecorded={(blob) => {
                            setState(prev => ({...prev, voice_note: null}));
                            setVoiceBlob(blob);
                        }} audioUrl={state.voice_note}/>,
                    ]
                    : null
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
                props.me.has_youtube_helper &&
                    <Col s={12}><Icon left>live_help</Icon><Checkbox name="youtube_helper" id="et_check-youtube-helper" label="Need youtube helper?" onChange={onChange} value="1" checked={state.youtube_helper}/></Col>
            }
            {
                state.youtube_helper &&
                    [
                        <Col s={12} key="label-vtd" className="label-column">
                            <label>Instructions about thumbnail</label>
                        </Col>,
                        <Textarea key="vid_thumb_desc" s={12} icon={<Icon>short_text</Icon>} name="video_thumb_desc"
                                  placeholder="Instructions about thumbnail" onChange={onChange} value={state.video_thumb_desc}/>,
                        <Col s={12} key="label-vtr" className="label-column">
                            <label>Video Thumbnail Reference Links</label>
                        </Col>,
                        <TextInput key="txt_thumbnail_link-0" s={12}
                                   icon={<Button style={{marginRight: "10px"}} className="btn-primary"
                                                 onClick={addThumbnailLink}><Icon>add</Icon></Button>}
                                   name="video_thumb_ref" type="url" validate placeholder="Video Thumbnail Reference Links"
                                   onChange={e => onChange(e, 0)} value={state.video_thumb_ref[0]}/>,
                        ...makeLinks("video_thumb_ref", state.video_thumb_ref, removeThumbnailLink),
                        <Col s={12} key="label-vod" className="label-column">
                            <label>Instruction about video title and description</label>
                        </Col>,
                        <Textarea key="vid_opt_desc" s={12} icon={<Icon>short_text</Icon>} name="video_optimization_desc"
                                  onChange={onChange} value={state.video_optimization_desc}/>,
                        <Col s={12} key="label-al" className="label-column">
                            <label>Affiliate or Product Links</label>
                        </Col>,
                        <TextInput key="txt_affiliate_link-0" s={12}
                                   icon={<Button style={{marginRight: "10px"}} className="btn-primary"
                                                 onClick={addAffiliateLink}><Icon>add</Icon></Button>}
                                   name="affiliate_links" type="url" validate placeholder="Affiliate or Product Links"
                                   onChange={e => onChange(e, 0)} value={state.affiliate_links[0]}/>,
                        ...makeLinks("affiliate_links", state.affiliate_links, removeAffiliateLink),
                    ]
            }
            {
                props.me.has_subtitles &&
                    <Col s={12}><Icon left>subtitles</Icon><Checkbox name="subtitles" id="et_check-subtitles" label="Add subtitles?" onChange={onChange} value="1" checked={state.subtitles !== 0}/></Col>
            }

            <Col s={12}><Icon left>all_inclusive</Icon>
                <Checkbox id="check-repurpose-edit" label="Do you want us to repurpose this video? "
                          onChange={() => setRepurpose(prev => !prev)} value="1" checked={repurpose}/>
            </Col>
            {
                repurpose ? React.Children.toArray([
                    <Col s={12} className="label-column">
                        <label>Which size(s) do you want your video in? (Max 2) *</label>
                    </Col>,
                    <TextInput s={12} placeholder="Custom video size" value={repurposeAspect} icon="aspect_ratio"
                               onChange={e => setRepurposeAspect( e?.target?.value)}/>,
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
            {
                props.isOpen ?
                    <Row>
                        <ChatBox cardId={props.cardId} me={props.me} poll={props.isOpen}/>
                    </Row>
                    : null
            }
        </Modal>
    );
};
