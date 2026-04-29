-- -----------------------------------------------------------------------------
-- SCRIPT: Sky Express VA - Insert 2nd Official Tour (Ionian Sea Adventure)
-- -----------------------------------------------------------------------------

WITH new_tour AS (
  INSERT INTO public.tours (title, description, badge_image_url)
  VALUES (
    'Ionian Sea Adventure', 
    'Explore the stunning Ionian islands on the western coast of Greece. A scenic journey featuring challenging crosswind landings and breathtaking coastal views. Complete all 5 legs to earn the exclusive Ionian Adventure badge!',
    'https://raw.githubusercontent.com/panagiotisspak20-ship-it/sky-express-va/master/resources/badges/ionian_adventure.png'
  )
  RETURNING id
)
INSERT INTO public.tour_legs (tour_id, sequence_order, departure_icao, arrival_icao, leg_name)
VALUES 
  ((SELECT id FROM new_tour), 1, 'LGAV', 'LGZA', 'Athens to Zakynthos'),
  ((SELECT id FROM new_tour), 2, 'LGZA', 'LGKF', 'Zakynthos to Kefalonia'),
  ((SELECT id FROM new_tour), 3, 'LGKF', 'LGKR', 'Kefalonia to Corfu'),
  ((SELECT id FROM new_tour), 4, 'LGKR', 'LGPZ', 'Corfu to Preveza'),
  ((SELECT id FROM new_tour), 5, 'LGPZ', 'LGAV', 'Preveza to Athens');
