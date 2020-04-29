DROP TABLE IF EXISTS `script`;
CREATE TABLE `script` (
  `id`   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
  `url`  VARCHAR(1000) NOT NULL,
  `type` VARCHAR(999) NOT NULL,
  `code` TEXT(99999),
  `desc` VARCHAR(1000),
  `index`INT NOT NULL,
  UNIQUE(`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `data`;
CREATE TABLE `data` (
  `id`        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `dateTime`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type`      VARCHAR(999) NOT NULL,
  `url`       VARCHAR(999) NOT NULL,
  `referrer`  VARCHAR(999),
  `userAgent` VARCHAR(999),
  `platform`  VARCHAR(50),
  `title`     VARCHAR(999),
  `language`  VARCHAR(99),
  `screen`    VARCHAR(50),
  `cookie`    VARCHAR(9999),
  `payload`   VARCHAR(999999)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;