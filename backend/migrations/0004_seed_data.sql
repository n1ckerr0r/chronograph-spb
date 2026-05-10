INSERT INTO location (id, name, description, geometry)
VALUES
    (1, 'Петропавловская крепость', 'Историческое ядро Санкт-Петербурга на Заячьем острове; место закладки крепости и символ основания города.', ST_SetSRID(ST_MakePoint(30.3167, 59.9500), 4326)),
    (2, 'Главное Адмиралтейство', 'Комплекс адмиралтейских построек и одна из главных градостроительных доминант центра Петербурга.', ST_SetSRID(ST_MakePoint(30.3086, 59.9375), 4326)),
    (3, 'Зимний дворец', 'Бывшая императорская резиденция на Дворцовой площади, центральное здание музейного комплекса Эрмитажа.', ST_SetSRID(ST_MakePoint(30.3146, 59.9398), 4326)),
    (4, 'Медный всадник', 'Конный памятник Петру I на Сенатской площади, один из наиболее узнаваемых символов Санкт-Петербурга.', ST_SetSRID(ST_MakePoint(30.3022, 59.9364), 4326)),
    (5, 'Казанский собор', 'Кафедральный собор на Невском проспекте, построенный для хранения Казанской иконы Божией Матери.', ST_SetSRID(ST_MakePoint(30.3249, 59.9343), 4326)),
    (6, 'Смольный собор', 'Собор Воскресения Христова в ансамбле Смольного монастыря на площади Растрелли.', ST_SetSRID(ST_MakePoint(30.3950, 59.9489), 4326)),
    (7, 'Исаакиевский собор', 'Крупнейший собор Петербурга на Исаакиевской площади, построенный по проекту Огюста Монферрана.', ST_SetSRID(ST_MakePoint(30.3061, 59.9341), 4326)),
    (8, 'Спас на Крови', 'Храм Воскресения Христова на месте смертельного ранения императора Александра II.', ST_SetSRID(ST_MakePoint(30.3287, 59.9400), 4326))
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    geometry = EXCLUDED.geometry,
    updated_at = now();

SELECT setval('location_id_seq', (SELECT max(id) FROM location));

INSERT INTO event (id, title, description, date_from, date_to, location_id)
VALUES
    (1, 'Закладка Петропавловской крепости', 'На Заячьем острове была заложена крепость, дата закладки которой считается днем основания Санкт-Петербурга.', '1703-05-27', NULL, 1),
    (2, 'Основание Адмиралтейства', 'Адмиралтейство было заложено как главная судостроительная верфь России на Балтийском море.', '1704-11-05', NULL, 2),
    (3, 'Строительство Зимнего дворца', 'По заказу Елизаветы Петровны архитектор Франческо Бартоломео Растрелли возвел монументальный барочный дворец.', '1754-01-01', '1762-12-31', 3),
    (4, 'Открытие памятника Петру I', 'На Сенатской площади был открыт памятник Петру I, позднее получивший название «Медный всадник».', '1782-08-18', NULL, 4),
    (5, 'Завершение строительства Казанского собора', 'Казанский собор был построен в 1801-1811 годах архитектором Андреем Воронихиным.', '1801-01-01', '1811-12-31', 5),
    (6, 'Освящение Смольного собора', 'Смольный собор был освящен после продолжительного строительства ансамбля Смольного монастыря.', '1835-07-20', NULL, 6),
    (7, 'Освящение Исаакиевского собора', 'Современное здание Исаакиевского собора было торжественно освящено в середине XIX века.', '1858-05-30', NULL, 7),
    (8, 'Освящение Спаса на Крови', 'Храм Воскресения Христова на Крови был торжественно освящен в присутствии Николая II и Александры Федоровны.', '1907-09-01', NULL, 8)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    date_from = EXCLUDED.date_from,
    date_to = EXCLUDED.date_to,
    location_id = EXCLUDED.location_id,
    updated_at = now();

SELECT setval('event_id_seq', (SELECT max(id) FROM event));

INSERT INTO tag (id, name)
VALUES
    (1, 'основание'),
    (2, 'фортификация'),
    (3, 'Пётр I'),
    (4, 'верфь'),
    (5, 'барокко'),
    (6, 'императорская резиденция'),
    (7, 'памятник'),
    (8, 'классицизм'),
    (9, 'собор'),
    (10, 'православие'),
    (11, 'XIX век'),
    (12, 'XX век')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

SELECT setval('tag_id_seq', (SELECT max(id) FROM tag));

INSERT INTO event_tag (event_id, tag_id)
VALUES
    (1, 1), (1, 2), (1, 3),
    (2, 3), (2, 4),
    (3, 5), (3, 6),
    (4, 3), (4, 7), (4, 8),
    (5, 8), (5, 9), (5, 10),
    (6, 5), (6, 9), (6, 10),
    (7, 8), (7, 9), (7, 10), (7, 11),
    (8, 9), (8, 10), (8, 12)
ON CONFLICT DO NOTHING;

INSERT INTO source (id, title, author, year, url, type)
VALUES
    (1, 'Исторический очерк Петропавловской крепости', 'Государственный музей истории Санкт-Петербурга', NULL, 'https://www.spbmuseum.ru/themuseum/museum_complex/peterpaul_fortress/ppk.php', 'web'),
    (2, 'История Адмиралтейства', 'Флот.ком', 2000, 'https://flot.com/edu/admiralty/hist-a.htm?print=Y', 'article'),
    (3, 'Зимний дворец', 'Государственный Эрмитаж', NULL, 'https://www.hermitagemuseum.org/explore/buildings/building_4?lng=ru', 'web'),
    (4, 'Медный всадник', 'Культура.РФ', NULL, 'https://www.culture.ru/institutes/10726/mednyi-vsadnik', 'web'),
    (5, 'Казанский кафедральный собор', 'Казанский собор', NULL, 'https://kazansky-sobor.ru/', 'web'),
    (6, 'Воскресенский Смольный собор', 'Воскресенский Смольный собор', NULL, 'https://smolnycobor.orgs.biz/', 'web'),
    (7, 'История собора', 'Государственный музей-памятник «Исаакиевский собор»', NULL, 'https://isaacy.ru/history/history-sobora/', 'web'),
    (8, 'История храма Спас на Крови', 'Государственный музей-памятник «Исаакиевский собор»', NULL, 'https://spas.spb.ru/history', 'web'),
    (9, 'Государственный Эрмитаж', 'Президентская библиотека имени Б.Н. Ельцина', NULL, 'https://www.prlib.ru/collections/1282824', 'archive')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    author = EXCLUDED.author,
    year = EXCLUDED.year,
    url = EXCLUDED.url,
    type = EXCLUDED.type;

SELECT setval('source_id_seq', (SELECT max(id) FROM source));

INSERT INTO event_source (event_id, source_id)
VALUES
    (1, 1),
    (2, 2),
    (3, 3),
    (3, 9),
    (4, 4),
    (5, 5),
    (6, 6),
    (7, 7),
    (8, 8)
ON CONFLICT DO NOTHING;

INSERT INTO media (id, event_id, url, caption, type)
VALUES
    (1, 1, 'https://www.spbmuseum.ru/', 'Страница Государственного музея истории Санкт-Петербурга', 'link'),
    (2, 3, 'https://www.hermitagemuseum.org/explore/buildings/building_4?lng=ru', 'Страница Зимнего дворца на сайте Эрмитажа', 'link'),
    (3, 4, 'https://www.culture.ru/institutes/10726/mednyi-vsadnik', 'Страница Медного всадника на Культура.РФ', 'link'),
    (4, 8, 'https://spas.spb.ru/history', 'История храма Спас на Крови', 'link')
ON CONFLICT (id) DO UPDATE
SET event_id = EXCLUDED.event_id,
    url = EXCLUDED.url,
    caption = EXCLUDED.caption,
    type = EXCLUDED.type;

SELECT setval('media_id_seq', (SELECT max(id) FROM media));
