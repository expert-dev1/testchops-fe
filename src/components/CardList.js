import React from 'react';
import {CollapsibleItem, Icon} from "react-materialize";
import RequestCard from "./RequestCard";

export default (props) => {

    let cards = props.cards || [];

    return (
        <CollapsibleItem
            className="cardList"
            expanded={true}
            header={props.name}
            icon={<Icon>arrow_drop_down</Icon>}
            node="div"
            onSelect={() => {}}
        >
            <div className="drag-container" data-card-status={props.type} data-card-repurpose-status={props.rType}
                 style={{minHeight: "10vh", minWidth: "300px"}}>
                {cards.map((card, index) => {
                    return (
                        <div data-paused={card.paused} data-complete={card.is_complete} data-card-id={card.card_id}
                             data-card-status={card.card_status} key={`card-${card.card_id}`}
                             data-card-repurpose-status={card.repurpose_status}
                             data-index={index} data-revisions={card.revision_nr}>
                            <RequestCard viewCard={props.viewCard} card={card}/>
                        </div>
                    );
                })}
            </div>
        </CollapsibleItem>
    );
};
