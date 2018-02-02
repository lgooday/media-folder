CREATE TABLE `item` (
  `hash` varchar(33) NOT NULL,
  `name` varchar(200) NOT NULL,
  `datecreated` datetime DEFAULT NULL,
  `dateinserted` datetime DEFAULT NULL,
  `exif` json DEFAULT NULL,
  `datecreatedfrom` varchar(10) DEFAULT NULL,
  `ext` varchar(5) DEFAULT NULL,
  `inputdir` varchar(255) DEFAULT NULL,
  `mediatype` varchar(20) DEFAULT NULL,
  `outputpath` text,
  `outputfilename` text,
  `error` text,
  `size` int(11) DEFAULT NULL,
  `exportstatus` tinyint(4) NOT NULL DEFAULT '0',
  `exportstatusdate` datetime DEFAULT NULL,
  PRIMARY KEY (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1