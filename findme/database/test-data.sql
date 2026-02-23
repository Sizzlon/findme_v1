-- Test Data for Swipe & Matching System
-- Run this in your Supabase SQL Editor to add test profiles

-- Add test job seekers
INSERT INTO job_seekers (id, name, email, bio, skills, personality, experience, education, address) VALUES 
(uuid_generate_v4(), 'Alice Johnson', 'alice@test.com', 'Passionate full-stack developer with 3 years experience. Love working on innovative projects and learning new technologies.', ARRAY['JavaScript', 'React', 'Node.js', 'Python'], 'Collaborative, creative, detail-oriented', '3 years as Full Stack Developer at TechCorp', 'Computer Science degree from MIT', 'San Francisco, CA'),
(uuid_generate_v4(), 'Bob Smith', 'bob@test.com', 'UX/UI designer focused on creating intuitive user experiences. Strong background in user research and prototyping.', ARRAY['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'], 'Empathetic, analytical, innovative', '2 years as UX Designer at DesignStudio', 'Design degree from Stanford', 'New York, NY'),
(uuid_generate_v4(), 'Carol Davis', 'carol@test.com', 'Data scientist with expertise in machine learning and analytics. Passionate about using data to solve real-world problems.', ARRAY['Python', 'Machine Learning', 'SQL', 'TensorFlow'], 'Analytical, curious, problem-solver', '4 years as Data Scientist at DataCorp', 'PhD in Statistics from Berkeley', 'Austin, TX'),
(uuid_generate_v4(), 'David Wilson', 'david@test.com', 'Frontend developer specializing in modern web technologies. Love creating beautiful and performant user interfaces.', ARRAY['React', 'Vue.js', 'TypeScript', 'CSS'], 'Creative, meticulous, team-player', '2 years as Frontend Developer at WebTech', 'Computer Science degree from UCLA', 'Los Angeles, CA');

-- Add test companies
INSERT INTO companies (id, company_name, email, description, culture, benefits, location, industry, company_size) VALUES 
(uuid_generate_v4(), 'TechStart Inc', 'hr@techstart.com', 'Fast-growing startup building the future of e-commerce. We value innovation, collaboration, and work-life balance.', 'Remote-first, collaborative, innovation-driven', ARRAY['Health insurance', 'Remote work', 'Flexible hours', 'Stock options'], 'San Francisco, CA', 'Technology', '50-100'),
(uuid_generate_v4(), 'Creative Solutions', 'jobs@creativesolutions.com', 'Design agency helping brands create meaningful connections with their customers through innovative design.', 'Creative, inclusive, client-focused', ARRAY['Health insurance', 'Creative time', 'Professional development', 'Flexible PTO'], 'New York, NY', 'Design', '20-50'),
(uuid_generate_v4(), 'DataDriven Corp', 'careers@datadriven.com', 'AI and machine learning company transforming industries through intelligent automation and analytics.', 'Data-driven, research-focused, cutting-edge', ARRAY['Health insurance', 'Research budget', 'Conference attendance', 'Equity'], 'Austin, TX', 'AI/ML', '100-200'),
(uuid_generate_v4(), 'WebFlow Agency', 'team@webflow-agency.com', 'Full-service web development agency creating modern web applications for forward-thinking companies.', 'Agile, quality-focused, continuous learning', ARRAY['Health insurance', 'Learning budget', 'Flexible schedule', 'Remote options'], 'Los Angeles, CA', 'Web Development', '10-20');

-- Verify the data was inserted
SELECT 'Job Seekers' as table_name, count(*) as count FROM job_seekers
UNION ALL
SELECT 'Companies' as table_name, count(*) as count FROM companies;

-- Check sample data
SELECT name, skills, address FROM job_seekers LIMIT 2;
SELECT company_name, industry, location FROM companies LIMIT 2;