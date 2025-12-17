-- Create test attempts table
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  user_email TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('written', 'listening')),
  answers JSONB NOT NULL DEFAULT '[]',
  score_percentage DECIMAL(5,2),
  cefr_level TEXT,
  recommended_course TEXT,
  ai_evaluation JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Allow public insert and select
CREATE POLICY "Anyone can create test attempts" 
ON public.test_attempts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view test attempts" 
ON public.test_attempts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update test attempts" 
ON public.test_attempts 
FOR UPDATE 
USING (true);