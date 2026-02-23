-- Add job vacancies table and update the matching system

-- 1. Create the job_vacancies table
CREATE TABLE IF NOT EXISTS job_vacancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    salary_range VARCHAR(100),
    employment_type VARCHAR(50) CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'freelance', 'internship')),
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'executive')),
    location VARCHAR(200),
    remote_work BOOLEAN DEFAULT false,
    skills_required TEXT[], -- Array of required skills
    benefits TEXT[], -- Array of benefits for this specific role
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    applications_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_vacancies_company_id ON job_vacancies(company_id);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_active ON job_vacancies(is_active);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_location ON job_vacancies(location);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_employment_type ON job_vacancies(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_experience_level ON job_vacancies(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_skills ON job_vacancies USING GIN(skills_required);

-- 3. Add RLS policies for job_vacancies
ALTER TABLE job_vacancies ENABLE ROW LEVEL SECURITY;

-- Companies can manage their own vacancies
CREATE POLICY "companies_can_manage_own_vacancies" ON job_vacancies
    FOR ALL 
    TO authenticated
    USING (auth.uid() = company_id)
    WITH CHECK (auth.uid() = company_id);

-- All authenticated users can view active vacancies (for swiping)
CREATE POLICY "authenticated_can_view_active_vacancies" ON job_vacancies
    FOR SELECT 
    TO authenticated
    USING (is_active = true);

-- 4. Update the swipes table to reference job_vacancies instead of companies directly
-- First, let's add a new column for vacancy_id
ALTER TABLE swipes ADD COLUMN IF NOT EXISTS vacancy_id UUID REFERENCES job_vacancies(id) ON DELETE CASCADE;

-- 5. Update the matches table to reference job_vacancies
-- Add vacancy_id to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS vacancy_id UUID REFERENCES job_vacancies(id) ON DELETE CASCADE;

-- 6. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_swipes_vacancy_id ON swipes(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_matches_vacancy_id ON matches(vacancy_id);

-- 7. Add some sample job vacancies for testing
INSERT INTO job_vacancies (company_id, title, description, requirements, responsibilities, salary_range, employment_type, experience_level, location, remote_work, skills_required, benefits, department) VALUES
-- TechStart Inc vacancies
((SELECT id FROM companies WHERE company_name = 'TechStart Inc' LIMIT 1), 
 'Senior Full-Stack Developer', 
 'Join our dynamic startup as a senior developer to build cutting-edge web applications.',
 'Bachelor''s degree in Computer Science or related field. 5+ years of experience with React, Node.js, and PostgreSQL.',
 'Develop and maintain web applications, mentor junior developers, participate in architecture decisions.',
 '$90,000 - $120,000',
 'full-time',
 'senior',
 'San Francisco, CA',
 true,
 ARRAY['React', 'Node.js', 'PostgreSQL', 'JavaScript', 'TypeScript'],
 ARRAY['Health insurance', 'Stock options', 'Remote work', 'Flexible hours'],
 'Engineering'),

((SELECT id FROM companies WHERE company_name = 'TechStart Inc' LIMIT 1),
 'Frontend Developer',
 'Create amazing user experiences with modern frontend technologies.',
 '3+ years of experience with React, CSS, and modern frontend tools.',
 'Build responsive web interfaces, collaborate with design team, optimize performance.',
 '$70,000 - $90,000',
 'full-time',
 'mid',
 'San Francisco, CA',
 true,
 ARRAY['React', 'CSS', 'JavaScript', 'HTML', 'Figma'],
 ARRAY['Health insurance', 'Stock options', 'Remote work'],
 'Engineering'),

-- Creative Solutions vacancies
((SELECT id FROM companies WHERE company_name = 'Creative Solutions' LIMIT 1),
 'UX/UI Designer',
 'Design intuitive and beautiful user interfaces for our clients.',
 'Portfolio showcasing UX/UI design skills. Experience with Figma and user research.',
 'Create wireframes and prototypes, conduct user research, collaborate with developers.',
 '$65,000 - $85,000',
 'full-time',
 'mid',
 'New York, NY',
 false,
 ARRAY['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
 ARRAY['Health insurance', 'Creative workspace', 'Professional development'],
 'Design'),

-- DataDriven Corp vacancies  
((SELECT id FROM companies WHERE company_name = 'DataDriven Corp' LIMIT 1),
 'Data Scientist',
 'Analyze complex datasets to drive business insights and machine learning solutions.',
 'Masters in Data Science or related field. Experience with Python, SQL, and ML frameworks.',
 'Build predictive models, analyze data trends, present findings to stakeholders.',
 '$95,000 - $130,000',
 'full-time',
 'senior',
 'Austin, TX',
 true,
 ARRAY['Python', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas'],
 ARRAY['Health insurance', 'Research budget', 'Conference attendance', 'Remote work'],
 'Data Science'),

-- WebFlow Agency vacancies
((SELECT id FROM companies WHERE company_name = 'WebFlow Agency' LIMIT 1),
 'React Developer',
 'Build modern web applications using React and related technologies.',
 '2+ years of React experience. Knowledge of modern JavaScript and web development.',
 'Develop React applications, work with APIs, ensure responsive design.',
 '$60,000 - $80,000',
 'full-time',
 'junior',
 'Los Angeles, CA',
 true,
 ARRAY['React', 'JavaScript', 'CSS', 'REST APIs', 'Git'],
 ARRAY['Health insurance', 'Flexible hours', 'Remote work', 'Learning budget'],
 'Development');

-- 8. Verify the data was inserted
SELECT 
    jv.id,
    jv.title,
    c.company_name,
    jv.location,
    jv.salary_range,
    jv.employment_type,
    jv.experience_level
FROM job_vacancies jv
JOIN companies c ON jv.company_id = c.id
ORDER BY c.company_name, jv.title;