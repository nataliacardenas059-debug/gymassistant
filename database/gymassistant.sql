-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-05-2026 a las 03:24:25
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gymassistant`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horarios_administrativos`
--

CREATE TABLE `horarios_administrativos` (
  `id` int(11) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `horarios_administrativos`
--
DELIMITER $$
CREATE TRIGGER `validar_horario_insert` BEFORE INSERT ON `horarios_administrativos` FOR EACH ROW BEGIN
    IF NEW.hora_fin <= NEW.hora_inicio THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La hora_fin debe ser mayor que hora_inicio';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validar_horario_update` BEFORE UPDATE ON `horarios_administrativos` FOR EACH ROW BEGIN
    IF NEW.hora_fin <= NEW.hora_inicio THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La hora_fin debe ser mayor que hora_inicio';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `membresias`
--

CREATE TABLE `membresias` (
  `id` int(11) NOT NULL,
  `persona_id` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `tipo` enum('mensual','chequera') NOT NULL,
  `dias_restantes` int(11) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'activa',
  `comprobante` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `membresias`
--

INSERT INTO `membresias` (`id`, `persona_id`, `fecha_inicio`, `fecha_fin`, `tipo`, `dias_restantes`, `estado`, `comprobante`) VALUES
(5, 2, '2026-05-09', '2026-06-09', 'mensual', NULL, 'activa', NULL),
(6, 9, '2026-05-06', '2026-06-06', 'mensual', NULL, 'activa', NULL),
(7, 11, '2026-05-10', '2026-06-03', 'mensual', NULL, 'activa', NULL),
(8, 12, '2026-04-09', '2026-05-09', 'mensual', NULL, 'inactiva', NULL),
(9, 12, '2026-05-11', '2026-06-10', 'mensual', NULL, 'activa', NULL);

--
-- Disparadores `membresias`
--
DELIMITER $$
CREATE TRIGGER `validar_fechas_membresia_insert` BEFORE INSERT ON `membresias` FOR EACH ROW BEGIN
    IF NEW.fecha_fin < NEW.fecha_inicio THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha_fin no puede ser menor que fecha_inicio';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validar_fechas_membresia_update` BEFORE UPDATE ON `membresias` FOR EACH ROW BEGIN
    IF NEW.fecha_fin < NEW.fecha_inicio THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha_fin no puede ser menor que fecha_inicio';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `tipo_documento` varchar(20) NOT NULL,
  `tipo_persona` varchar(20) NOT NULL,
  `rol` varchar(20) DEFAULT 'estudiante',
  `estado` varchar(20) DEFAULT 'activo',
  `ultima_asistencia` date DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `personas`
--

INSERT INTO `personas` (`id`, `nombre_completo`, `numero_documento`, `tipo_documento`, `tipo_persona`, `rol`, `estado`, `ultima_asistencia`, `correo`) VALUES
(2, 'Sara Sanchez', '1279027216', 'cc', 'estudiante', 'estudiante', 'activo', NULL, 'sara.sanchez216@pascualbravo.edu.co'),
(8, 'Juan Cardona', '1023823972', 'ti', 'estudiante', 'estudiante', 'activo', NULL, 'juan.cardona972@pascualbravo.edu.co'),
(9, 'Yasmin Liliana Isaza', '4353063721', 'CE', 'profesor', 'estudiante', 'activo', NULL, 'yasmin.liliana721@pascualbravo.edu.co'),
(10, 'Daniel Gonzalez Acevedo', '1022273640', 'PAS', 'estudiante', 'estudiante', 'activo', NULL, 'daniel.gonzalez640@pascualbravo.edu.co'),
(11, 'Martin Cardona Velez', '25237392', 'CC', 'administrativo', 'estudiante', 'activo', NULL, 'martin.cardona392@pascualbravo.edu.co'),
(12, 'Sofia Guzman Jaramillo', '273182029', 'CE', 'administrativo', 'estudiante', 'activo', NULL, 'sofia.guzman029@pascualbravo.edu.co'),
(13, 'Santiago Slazar Pineda', '12823218', 'CC', 'profesor', 'estudiante', 'activo', NULL, 'santiago.slazar218@pascualbravo.edu.co'),
(15, 'Luisa Fernanda Cárdenas Parra', '2716780', 'CC', 'profesor', 'estudiante', 'activo', NULL, 'luisa.fernanda780@pascualbravo.edu.co'),
(16, 'Natalia Cárdenas Vásquez', '1034991059', 'CC', 'estudiante', 'estudiante', 'activo', NULL, 'natalia.cardenas059@pascualbravo.edu.co'),
(17, 'Luisa Fernanda Cárdenas Parra', '215921289', 'CC', 'profesor', 'estudiante', 'activo', NULL, 'luisa.fernanda289@pascualbravo.edu.co'),
(18, 'Fernando Gaviria Salazar ', '48273843', 'CC', 'profesor', 'estudiante', 'activo', NULL, 'fernando.gaviria843@pascualbravo.edu.co'),
(19, 'Carlos Rivera Sánchez ', '2627289', 'CE', 'administrativo', 'estudiante', 'activo', NULL, 'carlos.rivera289@pascualbravo.edu.co'),
(20, 'Mónica Agudelo Cárdenas ', '26191039', 'TI', 'estudiante', 'estudiante', 'activo', NULL, 'monica.agudelo039@pascualbravo.edu.co'),
(21, 'Natalia Acevedo Gonzales', '261281209', 'PAS', 'estudiante', 'estudiante', 'activo', NULL, 'natalia.acevedo209@pascualbravo.edu.co');

--
-- Disparadores `personas`
--
DELIMITER $$
CREATE TRIGGER `validar_tipo_persona_insert` BEFORE INSERT ON `personas` FOR EACH ROW BEGIN
    IF NEW.tipo_persona NOT IN ('estudiante', 'profesor', 'administrativo') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tipo de persona inválido';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validar_tipo_persona_update` BEFORE UPDATE ON `personas` FOR EACH ROW BEGIN
    IF NEW.tipo_persona NOT IN ('estudiante', 'profesor', 'administrativo') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tipo de persona inválido';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesores`
--

CREATE TABLE `profesores` (
  `id` int(11) NOT NULL,
  `persona_id` int(11) NOT NULL,
  `tipo_profesor` varchar(20) DEFAULT NULL,
  `horas_semana` int(11) DEFAULT 0,
  `cumple_horas` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `profesores`
--

INSERT INTO `profesores` (`id`, `persona_id`, `tipo_profesor`, `horas_semana`, `cumple_horas`) VALUES
(1, 17, 'no_vinculado', 0, 0),
(2, 18, 'vinculado', 2, 0);

--
-- Disparadores `profesores`
--
DELIMITER $$
CREATE TRIGGER `validar_tipo_profesor_insert` BEFORE INSERT ON `profesores` FOR EACH ROW BEGIN 
    IF NEW.tipo_profesor NOT IN ('vinculado','no_vinculado') THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Tipo de profesor inválido: debe ser vinculado o no_vinculado'; 
    END IF; 
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validar_tipo_profesor_update` BEFORE UPDATE ON `profesores` FOR EACH ROW BEGIN
    IF NEW.tipo_profesor NOT IN ('interno', 'externo') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tipo de profesor inválido';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registros_ingreso`
--

CREATE TABLE `registros_ingreso` (
  `id` int(11) NOT NULL,
  `persona_id` int(11) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  `metodo_ingreso` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `registros_ingreso`
--

INSERT INTO `registros_ingreso` (`id`, `persona_id`, `fecha_hora`, `metodo_ingreso`) VALUES
(1, 11, '2026-05-10 13:30:53', 'recepcion'),
(2, 9, '2026-05-11 16:45:04', 'recepcion'),
(3, 2, '2026-05-11 17:02:01', 'recepcion');

--
-- Disparadores `registros_ingreso`
--
DELIMITER $$
CREATE TRIGGER `validar_metodo_ingreso_insert` BEFORE INSERT ON `registros_ingreso` FOR EACH ROW BEGIN 
    IF NEW.metodo_ingreso NOT IN ('codigo', 'recepcion', 'qr', 'manual') THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Método de ingreso inválido: Debe ser codigo, recepcion, qr o manual'; 
    END IF; 
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validar_metodo_ingreso_update` BEFORE UPDATE ON `registros_ingreso` FOR EACH ROW BEGIN 
    IF NEW.metodo_ingreso NOT IN ('codigo', 'recepcion', 'qr', 'manual') THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Método de ingreso inválido al actualizar'; 
    END IF; 
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_membresias`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_membresias` (
`nombre_completo` varchar(100)
,`numero_documento` varchar(20)
,`tipo_persona` varchar(20)
,`fecha_inicio` date
,`fecha_fin` date
,`estado` varchar(8)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_membresias`
--
DROP TABLE IF EXISTS `vista_membresias`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_membresias`  AS SELECT `p`.`nombre_completo` AS `nombre_completo`, `p`.`numero_documento` AS `numero_documento`, `p`.`tipo_persona` AS `tipo_persona`, `m`.`fecha_inicio` AS `fecha_inicio`, `m`.`fecha_fin` AS `fecha_fin`, CASE WHEN curdate() between `m`.`fecha_inicio` and `m`.`fecha_fin` THEN 'Activa' ELSE 'Inactiva' END AS `estado` FROM (`personas` `p` join `membresias` `m` on(`p`.`id` = `m`.`persona_id`)) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `horarios_administrativos`
--
ALTER TABLE `horarios_administrativos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `membresias`
--
ALTER TABLE `membresias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `persona_id` (`persona_id`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`),
  ADD UNIQUE KEY `numero_documento_2` (`numero_documento`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `profesores`
--
ALTER TABLE `profesores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `persona_id` (`persona_id`);

--
-- Indices de la tabla `registros_ingreso`
--
ALTER TABLE `registros_ingreso`
  ADD PRIMARY KEY (`id`),
  ADD KEY `persona_id` (`persona_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `horarios_administrativos`
--
ALTER TABLE `horarios_administrativos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `membresias`
--
ALTER TABLE `membresias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `profesores`
--
ALTER TABLE `profesores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `registros_ingreso`
--
ALTER TABLE `registros_ingreso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `membresias`
--
ALTER TABLE `membresias`
  ADD CONSTRAINT `membresias_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `profesores`
--
ALTER TABLE `profesores`
  ADD CONSTRAINT `profesores_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `registros_ingreso`
--
ALTER TABLE `registros_ingreso`
  ADD CONSTRAINT `registros_ingreso_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Eventos
--
CREATE DEFINER=`root`@`localhost` EVENT `actualizar_estado_membresias` ON SCHEDULE EVERY 1 DAY STARTS '2026-05-11 16:29:01' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE membresias
SET estado = 
    CASE
        WHEN tipo = 'mensual' AND CURDATE() BETWEEN fecha_inicio AND fecha_fin THEN 'activa'
        WHEN tipo = 'chequera' AND dias_restantes > 0 THEN 'activa'
        ELSE 'inactiva'
    END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
