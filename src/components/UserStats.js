import React, {useEffect, useState} from "react";
import {Button, Card, Col, Icon, ProgressBar, Row, Table} from "react-materialize";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {exportTableToCSV, onSortTable} from "../api/Util";
import {randomNumber} from "react-ratings-declarative/build/utils";

export default ({data, start, end, title}) => {
    const [filter, setFilter] = useState('');
    const [stats, setStats] = useState([]);
    const [sortBy, setSortBy] = useState(false);

    useEffect(() => {
        setStats(Object.keys(data?.names || {})
            .map(userId => ({
                id: userId,
                name: data?.names[userId],
                requests: data?.requests[userId],
                inProgress: data?.in_progress[userId],
                onTime: data?.on_time[userId],
                overDue: data?.main_overdue[userId],
                revisionsOverDue: data?.revisions_overdue[userId],
                completed: data?.done[userId],
                revisions: data?.revisions[userId],
                avgHours: data?.total_time[userId] / Math.max(1, data?.done[userId]),
                avgRating: data?.ratings[userId] / Math.max(data?.rated_videos[userId], 1),
                ratings: data?.rated_videos[userId] || 0,
            }))
        );
    }, [data]);

    let tableId = title.replaceAll(/\s/g, '-') + '-' + randomNumber();

    return (
        <Card title={title}>
            <Row>
                <Col><Button large flat icon={<Icon left>save</Icon>} onClick={() => exportTableToCSV(tableId, `${title} ${start} - ${end}.csv`)}>Export as CSV</Button></Col>
                <Col s={6}><input type="text" onChange={e => setFilter(e.target.value)} placeholder="Filter" value={filter}/></Col>
            </Row>
            <Table responsive={true} hoverable={true} id={tableId}>
                <thead>
                <tr>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'name', sortBy, setSortBy)}>Name
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'requests', sortBy, setSortBy)}>Requests
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'inProgress', sortBy, setSortBy)}>In Progress
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'onTime', sortBy, setSortBy)}>On Time
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'overDue', sortBy, setSortBy)}>Overdue
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'revisionsOverDue', sortBy, setSortBy)}>Revisions Overdue
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'completed', sortBy, setSortBy)}>Completed
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'revisions', sortBy, setSortBy)}>Revisions
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'avgHours', sortBy, setSortBy)}>Average Time
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'avgRating', sortBy, setSortBy)}>
                        <FontAwesomeIcon icon="star" color="#FFD700" size="xs" title="☆"/>☆
                    </th>
                    <th style={{cursor: "pointer"}}
                        onClick={() => onSortTable(stats, setStats, 'ratings', sortBy, setSortBy)}>Ratings
                    </th>
                </tr>
                </thead>
                <tbody>
                {
                    stats.filter(user => user.name?.toLowerCase()?.includes(filter.toLowerCase()))
                        .map(user => <tr key={user.id + "-row"}>
                            <td>{user.name}</td>
                            <td>{user.requests}</td>
                            <td>{user.inProgress}</td>
                            <td>{user.onTime}</td>
                            <td>{user.overDue}</td>
                            <td>{user.revisionsOverDue}</td>
                            <td>{user.completed}</td>
                            <td>{user.revisions}</td>
                            <td><ProgressBar progress={(100.0 - ((48.0 - user.avgHours) / 48.0) * 100)} />{user.avgHours.toFixed(2)} hrs</td>
                            <td>{user.avgRating.toFixed(2)}</td>
                            <td>{user.ratings}</td>
                        </tr>)
                }
                </tbody>
            </Table>
        </Card>);
}
