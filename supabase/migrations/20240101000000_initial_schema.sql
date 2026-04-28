-- ============================================================
-- Initial Schema Migration
-- Good Deeds Bingo - Full schema with seed data
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  password_hash TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  signup_bonus_granted BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- OIDC states table (for OIDC login flow)
CREATE TABLE IF NOT EXISTS oidc_states (
  id SERIAL PRIMARY KEY,
  state TEXT UNIQUE NOT NULL,
  nonce TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player wallets
CREATE TABLE IF NOT EXISTS player_wallets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_wallets_user ON player_wallets(user_id);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  item_description TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);

-- Good deeds
CREATE TABLE IF NOT EXISTS good_deeds (
  id SERIAL PRIMARY KEY,
  deed_text TEXT NOT NULL,
  deed_text_long TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game configs (key-value store for admin settings)
CREATE TABLE IF NOT EXISTS game_configs (
  id SERIAL PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player bingo cards
CREATE TABLE IF NOT EXISTS player_cards (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_year TEXT NOT NULL,
  card_seed TEXT,
  card_data TEXT NOT NULL,
  win_condition TEXT NOT NULL,
  completed_cells TEXT,
  purchased_cells TEXT,
  referral_cells TEXT,
  is_bingo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_cards_user_week ON player_cards(user_id, week_year);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  is_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(user_id);

-- Pending deeds (user suggestions awaiting admin approval)
CREATE TABLE IF NOT EXISTS pending_deeds (
  id SERIAL PRIMARY KEY,
  deed_text TEXT NOT NULL,
  deed_text_long TEXT,
  category TEXT,
  notes TEXT,
  suggested_by_user_id TEXT,
  suggested_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Seed: game_configs
-- ============================================================
INSERT INTO game_configs (config_key, config_value, description, updated_at) VALUES
  ('purchasable_count', '2', 'DEPRECATED: purchasable squares are now randomized 1-3 per card', NOW()),
  ('referral_free_count', '1', 'DEPRECATED: referral free squares are now randomized 0-2 per card', NOW()),
  ('dollar1_pct', '50', 'Percentage of purchasable squares that cost $0.50', NOW()),
  ('dollar2_pct', '30', 'Percentage of purchasable squares that cost $1.00', NOW()),
  ('dollar5_pct', '20', 'Percentage of purchasable squares that cost $2.00', NOW()),
  ('win_condition', 'one_line', 'Active game mode win condition (one_line, two_lines, four_corners, x_pattern, around_the_edges, fill_card)', NOW()),
  ('admin_password', '472118199', 'Admin panel password', NOW()),
  ('prize_image_url', '', 'URL of this game''s prize image (shown on homepage and game board)', NOW()),
  ('prize_title', 'This Week''s Prize', 'Title/label shown above the prize image', NOW()),
  ('signup_bonus_amount', '15', 'Signup bonus amount in dollars', NOW()),
  ('secret_reward_1_pct', '50', 'Percentage of secret squares that give $1', NOW()),
  ('secret_reward_2_pct', '30', 'Percentage of secret squares that give $2', NOW())
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- Seed: good_deeds (56 deeds)
-- ============================================================
INSERT INTO good_deeds (deed_text, deed_text_long, category, is_active, created_at) VALUES
  ('Buy a coffee for the person behind you in line', 'Next time you''re at a cafe, quietly pay for the drink of the person behind you. A small $3-$5 gesture that creates an unexpected moment of joy and often sparks a pay-it-forward chain.', 'Generosity', true, NOW()),
  ('Donate to a local food bank or shelter', 'Drop off non-perishable food, hygiene items, or funds at a nearby food bank or homeless shelter. Even a single bag of groceries can provide multiple meals for a family in need.', 'Charity', true, NOW()),
  ('Write a heartfelt thank-you note to a mentor', 'Think of a teacher, coach, boss, or friend who shaped who you are today. Write them a handwritten note telling them specifically what they did and how it mattered. It costs nothing and can make their entire year.', 'Gratitude', true, NOW()),
  ('Volunteer for a community cleanup event', 'Sign up for a local park, beach, or neighborhood cleanup. Spend a few hours picking up litter with others who care about the same space you live in. Great for the planet and for meeting good people.', 'Community', true, NOW()),
  ('Leave a generous tip for your server', 'The next time you eat out, leave a tip noticeably larger than the standard 18-20% — especially if service was kind. Tipped workers often rely on generosity to make ends meet.', 'Generosity', true, NOW()),
  ('Check in on an elderly neighbor', 'Knock on the door of an older neighbor just to say hi. Ask if they need anything from the store, help with yard work, or just chat for a while. Loneliness is one of the biggest health risks for seniors.', 'Compassion', true, NOW()),
  ('Cook a meal for a friend going through a tough time', 'Drop off a home-cooked meal (or order delivery) for someone dealing with illness, grief, a newborn, or a hard week. Food is love — it says ''I''m here, you don''t have to think about dinner tonight.''', 'Compassion', true, NOW()),
  ('Pay for a stranger''s groceries', 'Spot someone at checkout counting change or short a few dollars? Quietly cover their bill. Even a small amount can turn a stressful moment into one they''ll remember for years.', 'Generosity', true, NOW()),
  ('Send a care package to someone in the military', 'Put together a box of snacks, toiletries, letters, and small comforts and ship it to a deployed service member. Organizations like Soldiers'' Angels and Operation Gratitude make it easy.', 'Service', true, NOW()),
  ('Mentor a young professional in your field', 'Offer to grab coffee (or jump on a video call) with someone earlier in your career. Share what you''ve learned, review their resume, or just answer questions. One conversation can change someone''s trajectory.', 'Professional', true, NOW()),
  ('Organize a neighborhood potluck dinner', 'Invite neighbors (even ones you barely know) to bring a dish and gather. Strong neighborhoods are built on shared meals. Use a group text, flyer, or an app like Nextdoor to spread the word.', 'Community', true, NOW()),
  ('Leave a positive review for a local small business', 'Small businesses live and die by online reviews. Write a specific, genuine 5-star review for a cafe, shop, or service you love. It takes five minutes and can literally keep them in business.', 'Support', true, NOW()),
  ('Donate professional clothes to a job-readiness program', 'Clean out your closet and donate gently-used suits, dress shirts, blouses, and shoes to organizations like Dress for Success or Career Gear. They give people re-entering the workforce the confidence of a great first impression.', 'Charity', true, NOW()),
  ('Write a recommendation letter for a colleague', 'If a coworker is applying for a promotion, a grad program, or a new job — offer to write an unsolicited recommendation. Be specific about their impact. It''s one of the most valuable gifts you can give professionally.', 'Professional', true, NOW()),
  ('Bring homemade treats to your workplace', 'Bake cookies, brownies, or muffins and drop them in the break room with a note saying ''help yourself.'' It lifts the energy of an entire office and reminds people they''re appreciated.', 'Kindness', true, NOW()),
  ('Offer to babysit for a friend so they can have a night out', 'Parents of young kids desperately need time alone or with their partner. Offer an evening of free babysitting so your friend can go on a date, see a movie, or just sleep. It''s priceless.', 'Support', true, NOW()),
  ('Drive a neighbor to a medical appointment', 'Many elderly or ill people skip important appointments because they can''t drive. Offer a ride, wait for them, and drive them home. Your two hours could protect someone''s health for years.', 'Compassion', true, NOW()),
  ('Donate blood at your local blood bank', 'A single donation can save up to three lives. It takes about an hour, is safe, and you get snacks. Visit Red Cross or a local blood bank to schedule — they''re almost always in shortage.', 'Health', true, NOW()),
  ('Plant a tree or start a community garden', 'Plant a tree in your yard, sponsor one through a reforestation charity, or start a small community garden plot. Trees cool neighborhoods, clean air, and live for generations.', 'Environment', true, NOW()),
  ('Teach a free class or workshop in your area of expertise', 'Host a free workshop — at your local library, community center, or online — on something you know well. Cooking, budgeting, coding, gardening, resume writing — your knowledge is more valuable than you think.', 'Education', true, NOW()),
  ('Forgive someone you''ve been holding a grudge against', 'Forgiveness is a gift you give yourself. Let go of a resentment you''ve been carrying. You don''t have to reconcile or announce it — just release it internally. Your mind and body will thank you.', 'Personal Growth', true, NOW()),
  ('Surprise your partner with a thoughtful date night', 'Plan an evening entirely for your partner — their favorite food, a movie they''ve been wanting to see, or a quiet walk. No phones. Show them they still matter after years of routine.', 'Relationships', true, NOW()),
  ('Offer your seat to someone on public transit', 'Stand up for a pregnant person, elderly rider, parent with kids, or anyone who looks like they could use the seat more than you. A 20-second act of courtesy that makes a visible difference.', 'Courtesy', true, NOW()),
  ('Help a coworker with a project without being asked', 'Notice a colleague drowning in work? Offer to take a piece of it off their plate with no strings attached. Being the person who just shows up and helps is rare — and deeply remembered.', 'Professional', true, NOW()),
  ('Call a family member you haven''t spoken to in a while', 'Pick up the phone and actually call — not text — a parent, sibling, grandparent, aunt, or cousin you''ve drifted from. Ten minutes of real conversation can reset a whole relationship.', 'Relationships', true, NOW()),
  ('Tip your delivery driver extra generously', 'Food, grocery, and package drivers work long shifts in tough conditions and often take home less than you''d guess. Add a few extra dollars next time — it makes a real difference in their week.', 'Generosity', true, NOW()),
  ('Donate unused household items to a charity shop', 'Box up clothes, kitchenware, books, and small furniture you don''t use anymore and take them to Goodwill, Salvation Army, or a local charity. You declutter your home AND help families shopping on a budget.', 'Charity', true, NOW()),
  ('Write a sincere apology to someone you''ve wronged', 'Think of a relationship damaged by something you did or said. Reach out and apologize — not a defensive ''sorry if you felt...'', but a real one. It''s terrifying and freeing in equal measure.', 'Personal Growth', true, NOW()),
  ('Volunteer at a local animal shelter', 'Shelters always need help walking dogs, socializing cats, cleaning kennels, or helping at adoption events. A few hours of love from you can get an animal closer to finding a forever home.', 'Service', true, NOW()),
  ('Host a game night and invite someone new', 'Open up your regular friend group and intentionally include someone new to the area, a lonely coworker, or a neighbor. Belonging starts with being invited once.', 'Social', true, NOW()),
  ('Leave an encouraging note for a stranger to find', 'Write ''You''re doing great'' or ''Someone is proud of you today'' on a sticky note and leave it on a bathroom mirror, library book, or park bench. A tiny ripple of kindness for whoever needs it.', 'Kindness', true, NOW()),
  ('Support a friend''s side hustle or small business', 'Buy something from a friend''s shop, book their service, or share their business on social media with a real endorsement. Early support is what keeps dreams alive when they''re most fragile.', 'Support', true, NOW()),
  ('Spend an afternoon picking up litter in your neighborhood', 'Grab a bag and gloves and walk around picking up trash on your street, local park, or a nearby trail. You''ll notice more than you expect — and so will everyone else who walks there after.', 'Environment', true, NOW()),
  ('Compliment a stranger genuinely', 'Tell a stranger their outfit is great, their laugh is contagious, or their kid is adorable — only if you truly mean it. Unexpected sincere compliments stay with people for days.', 'Kindness', true, NOW()),
  ('Donate to a GoFundMe for someone in need', 'Scroll through GoFundMe or ask around — medical bills, funeral costs, emergencies. Even $5 or $10 from many people adds up fast. Contribute and share the link so others can too.', 'Charity', true, NOW()),
  ('Offer to walk a neighbor''s dog', 'If you know someone with a busy week, an injury, or a demanding job, offer to take their dog around the block. Dogs get exercise, owners get relief, and you get a furry friend for an hour.', 'Community', true, NOW()),
  ('Bring flowers to a nursing home', 'Pick up a few inexpensive bouquets and drop them off at a local nursing home or memory care unit. Ask staff to give them to residents who don''t get many visitors. A small act that brightens entire days.', 'Compassion', true, NOW()),
  ('Sign up as an organ donor', 'Update your driver''s license or register at organdonor.gov to become an organ donor. One donor can save up to 8 lives and enhance dozens more. Zero cost, zero effort, immeasurable legacy.', 'Health', true, NOW()),
  ('Mediate a conflict between friends or family', 'If you see two people you care about drifting because of a misunderstanding, be the bridge. Listen to both sides without taking one, and gently help them hear each other. Peacekeeping is rare and precious.', 'Relationships', true, NOW()),
  ('Tutor a student for free', 'Volunteer with a local school, afterschool program, or online platform like Schoolhouse.world to tutor a student struggling in a subject you know well. One hour a week can close achievement gaps.', 'Education', true, NOW()),
  ('Organize a clothing drive at your workplace', 'Put a donation bin in your office for a week or two. Partner with a local shelter or thrift charity. Coworkers love an easy way to declutter and help — you just need to start it.', 'Charity', true, NOW()),
  ('Shovel snow or rake leaves for an elderly neighbor', 'After a snowfall or during fall, spend 30 extra minutes doing the elderly neighbor''s walkway or yard. No need to announce it. The surprise of waking up to a cleared driveway is a very real gift.', 'Community', true, NOW()),
  ('Write a letter to a local representative about a cause you care about', 'Mail or email your city council member, state rep, or congressperson about an issue you care about. Personalized constituent letters carry real weight — many offices log them directly.', 'Civic', true, NOW()),
  ('Spend quality time with a friend without looking at your phone', 'Next time you meet a friend for coffee or dinner, leave your phone in your bag. Give them your full attention for the whole meeting. In a distracted world, presence is the rarest gift.', 'Relationships', true, NOW()),
  ('Donate books to a local library or Little Free Library', 'Gather books you''ve already read and drop them at a library donation bin or neighborhood Little Free Library box. Your favorite story could become someone else''s favorite escape.', 'Education', true, NOW()),
  ('Prepare a meal for a new parent in your life', 'The first few weeks of parenthood are survival mode. Cook a freezer-friendly meal and drop it off without expecting to be invited in. Bonus points for paper plates (no dishes!).', 'Support', true, NOW()),
  ('Give a genuine compliment to your boss or manager', 'Managers get a lot of complaints and very little appreciation. Next 1:1, tell your boss specifically what they do well that makes your job better. It changes the whole working relationship.', 'Professional', true, NOW()),
  ('Participate in a charity run or walk', 'Sign up for a local 5K, fundraising walk, or charity ride. Pay the registration fee, raise a bit extra if you can, and show up. Move your body, raise money, meet good humans.', 'Health', true, NOW()),
  ('Send a handwritten card to a friend just because', 'No birthday, no holiday, no reason. Mail an actual card saying ''thinking of you, glad you exist.'' Handwritten mail in 2026 is rare enough that it lands like a minor miracle.', 'Kindness', true, NOW()),
  ('Offer your professional skills pro bono to a nonprofit', 'Are you a designer, developer, accountant, lawyer, writer? Offer a few hours to a small nonprofit that can''t afford your rates. Skilled volunteering has outsized impact for mission-driven orgs.', 'Service', true, NOW()),
  ('Set up a recurring donation to a cause you believe in', 'Charities rely on predictable monthly income far more than one-time gifts. Even $10/month to a cause you love provides stability they can plan around. Set it and forget it.', 'Charity', true, NOW()),
  ('Help a friend move without being asked twice', 'Moving is exhausting, expensive, and emotional. If a friend is relocating, just show up with a truck or strong arms. Don''t wait for the ''I hate to ask but...'' text — offer first.', 'Support', true, NOW()),
  ('Practice active listening in every conversation today', 'For one full day, commit to really listening when people talk — no planning your response, no interrupting, no phone glances. Ask one follow-up question. You''ll be shocked what people open up about.', 'Personal Growth', true, NOW()),
  ('Bring reusable bags and refuse single-use plastics for a week', 'Carry reusable grocery bags, a water bottle, and a coffee mug for an entire week. Say no to plastic bags, straws, and bottles. One week builds habits that can last a lifetime.', 'Environment', true, NOW()),
  ('Introduce two people in your network who could help each other', 'Think of two contacts who''d benefit from knowing each other — a mentor and mentee, a hiring manager and job seeker, two founders in related spaces. Send a warm intro email. Connections compound.', 'Professional', true, NOW()),
  ('Attend a local council meeting to support your community', 'City council, school board, and community meetings shape your daily life more than national politics. Show up once. Listen. Speak if you care. Local democracy thrives on regular-person participation.', 'Civic', true, NOW())
ON CONFLICT DO NOTHING;
