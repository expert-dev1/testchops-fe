import React, {useEffect, useState} from "react";
import {Button, Card, Col, Icon, Row, Table} from "react-materialize";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {exportTableToCSV, onSortTable} from "../api/Util";
import {CANCELED} from "../api/Constants";

export default ({data, start, end}) => {
    const [filter, setFilter] = useState('');
    const [stats, setStats] = useState([]);
    const [sortBy, setSortBy] = useState(false);

    useEffect(() => setStats(data), [data]);

    return (
        <Card title="Videos Breakdown">
            <Row>
                <Col><Button large flat icon={<Icon left>save</Icon>}
                             onClick={() => exportTableToCSV('video-breakdown-table', `Videos Breakdown ${start} - ${end}.csv`)}>
                    Export as CSV</Button>
                </Col>
                <Col s={6}><input type="text" onChange={e => setFilter(e.target.value)} placeholder="Filter" value={filter}/></Col>
            </Row>
            <Table responsive={true} hoverable={true} id="video-breakdown-table">
                <thead>
                <tr>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'card_title', sortBy, setSortBy)}>Title
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'client_name', sortBy, setSortBy)}>Client
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'editor_name', sortBy, setSortBy)}>Editor
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'card_status', sortBy, setSortBy)}>Status
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'creation_time', sortBy, setSortBy)}>Created On
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'editing_time', sortBy, setSortBy)}>Editing Time
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'qa_time', sortBy, setSortBy)}>QA Time
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'time_consumed', sortBy, setSortBy)}>Time Elapsed
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'overdue', sortBy, setSortBy)}>Overdue
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'revisions_overdue', sortBy, setSortBy)}>Revisions Overdue
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'rating', sortBy, setSortBy)}>
                        <FontAwesomeIcon icon="star" color="#FFD700" size="xs" title="☆"/>☆
                    </th>
                    <th style={{display: "none"}}>Comments</th>
                </tr>
                </thead>
                <tbody>
                {
                    stats?.filter(card => card.card_title?.toLowerCase()?.includes(filter.toLowerCase())
                        || card.card_status?.toLowerCase()?.includes(filter.toLowerCase())
                        || card.client_name?.toLowerCase()?.includes(filter.toLowerCase())
                        || card.editor_name?.toLowerCase()?.includes(filter.toLowerCase())
                    )
                        ?.map(card => <tr key={card.card_id + "-row-card"}
                                          style={card.time_consumed > card.timeline && card.card_status !== CANCELED ?
                                              {backgroundColor: 'rgba(255,0,0,0.1)'} : {}}>
                            <td>{card.card_title}</td>
                            <td>{card.client_name}</td>
                            <td>{card.editor_name}</td>
                            <td>{card.card_status.toUpperCase()}</td>
                            <td>{card.creation_time}</td>
                            <td>{((card.editing_time || 0) / 3600.0).toFixed(2)} Hrs</td>
                            <td>{((card.qa_time || 0) / 3600.0).toFixed(2)} Hrs</td>
                            <td>{card.time_consumed.toFixed(2)} Hrs</td>
                            <td>{card.overdue <= 0 ? "No" : "Yes"}</td>
                            <td>{card.revisions_overdue}</td>
                            <td>{card.rating}</td>
                            <td>{card.comment}</td>
                        </tr>)
                }
                </tbody>
            </Table>
        </Card>);
}
