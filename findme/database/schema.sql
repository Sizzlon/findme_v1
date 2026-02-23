-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'trial');
CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE remote_policy AS ENUM ('remote', 'hybrid', 'office');
CREATE TYPE sender_type AS ENUM ('job_seeker', 'company');

-- Create job_seekers table
CREATE TABLE job_seekers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    preferences TEXT[],
    skills TEXT[],
    personality TEXT,
    bio TEXT,
    experience TEXT,
    education TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    culture TEXT,
    benefits TEXT[],
    location TEXT,
    website TEXT,
    company_size VARCHAR(100),
    industry VARCHAR(100),
    logo_url TEXT,
    subscription_status subscription_status DEFAULT 'trial',
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vacancies table
CREATE TABLE vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    preferred_skills TEXT[],
    personality_preferred TEXT,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    location TEXT,
    job_type job_type DEFAULT 'full-time',
    salary_range VARCHAR(100),
    remote_policy remote_policy DEFAULT 'office',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    job_seeker_interested BOOLEAN DEFAULT false,
    company_accepted BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_seeker_id, vacancy_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type sender_type NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_job_seekers_email ON job_seekers(email);
CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_vacancies_company_id ON vacancies(company_id);
CREATE INDEX idx_vacancies_is_active ON vacancies(is_active);
CREATE INDEX idx_matches_job_seeker_id ON matches(job_seeker_id);
CREATE INDEX idx_matches_company_id ON matches(company_id);
CREATE INDEX idx_matches_vacancy_id ON matches(vacancy_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_job_seekers_updated_at 
    BEFORE UPDATE ON job_seekers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacancies_updated_at 
    BEFORE UPDATE ON vacancies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Job seekers can only see and edit their own data
CREATE POLICY "Job seekers can view own profile" ON job_seekers
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Job seekers can update own profile" ON job_seekers
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Job seekers can insert own profile" ON job_seekers
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Companies can only see and edit their own data
CREATE POLICY "Companies can view own profile" ON companies
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Companies can update own profile" ON companies
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Companies can insert own profile" ON companies
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Vacancies policies
CREATE POLICY "Companies can manage own vacancies" ON vacancies
    FOR ALL USING (auth.uid()::text = company_id::text);

CREATE POLICY "Job seekers can view active vacancies" ON vacancies
    FOR SELECT USING (is_active = true);

-- Matches policies
CREATE POLICY "Users can view relevant matches" ON matches
    FOR SELECT USING (
        auth.uid()::text = job_seeker_id::text OR 
        auth.uid()::text = company_id::text
    );

CREATE POLICY "Job seekers can create matches" ON matches
    FOR INSERT WITH CHECK (auth.uid()::text = job_seeker_id::text);

CREATE POLICY "Companies can update matches" ON matches
    FOR UPDATE USING (auth.uid()::text = company_id::text);

-- Messages policies
CREATE POLICY "Users can view messages in their matches" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (
                matches.job_seeker_id::text = auth.uid()::text OR 
                matches.company_id::text = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can send messages in their matches" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (
                (matches.job_seeker_id::text = auth.uid()::text AND messages.sender_type = 'job_seeker') OR
                (matches.company_id::text = auth.uid()::text AND messages.sender_type = 'company')
            )
        ) AND
        auth.uid()::text = messages.sender_id::text
    );