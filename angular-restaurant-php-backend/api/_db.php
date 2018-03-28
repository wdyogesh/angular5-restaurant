<?php

$db_exists = file_exists("daypilot.sqlite");

$db = new PDO('sqlite:daypilot.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

date_default_timezone_set("UTC");

if (!$db_exists) {
    //create the database
    $db->exec("CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY,
        name TEXT,
        start DATETIME,
        end DATETIME,
        resource_id VARCHAR(30))");

    $db->exec("CREATE TABLE groups (
        id INTEGER  NOT NULL PRIMARY KEY,
        name VARCHAR(200)  NULL)");

    $db->exec("CREATE TABLE resources (
        id INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
        name VARCHAR(200)  NULL,
        seats INTEGER,
        group_id INTEGER  NULL)");

    $items = array(
        array('id' => '1', 'name' => 'Indoors'),
        array('id' => '2', 'name' => 'Terrace'),
    );
    $insert = "INSERT INTO [groups] (id, name) VALUES (:id, :name)";
    $stmt = $db->prepare($insert);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':name', $name);
    foreach ($items as $m) {
        $id = $m['id'];
        $name = $m['name'];
        $stmt->execute();
    }

    $items = array(
        array('group_id' => '1', 'name' => 'Table 1', 'seats' => 2),
        array('group_id' => '1', 'name' => 'Table 2', 'seats' => 3),
        array('group_id' => '1', 'name' => 'Table 3', 'seats' => 4),
        array('group_id' => '1', 'name' => 'Table 4', 'seats' => 4),
        array('group_id' => '1', 'name' => 'Table 5', 'seats' => 6),
        array('group_id' => '1', 'name' => 'Table 6', 'seats' => 6),
        array('group_id' => '2', 'name' => 'Table 21', 'seats' => 2),
        array('group_id' => '2', 'name' => 'Table 22', 'seats' => 2),
        array('group_id' => '2', 'name' => 'Table 23', 'seats' => 5),
        array('group_id' => '2', 'name' => 'Table 24', 'seats' => 5),
        array('group_id' => '2', 'name' => 'Table 25', 'seats' => 6),
        array('group_id' => '2', 'name' => 'Table 26', 'seats' => 6),
    );
    $insert = "INSERT INTO [resources] (group_id, name, seats) VALUES (:group_id, :name, :seats)";
    $stmt = $db->prepare($insert);
    $stmt->bindParam(':group_id', $group_id);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':seats', $seats);
    foreach ($items as $m) {
        $group_id = $m['group_id'];
        $name = $m['name'];
        $seats = $m['seats'];
        $stmt->execute();
    }
}

?>
