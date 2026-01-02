-- ============================================
-- STORED PROCEDURES FOR PERFORMANCE
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This optimizes database operations
-- ============================================

-- Function to submit an answer with validation in one call
CREATE OR REPLACE FUNCTION submit_answer(
  p_participant_id UUID,
  p_session_id UUID,
  p_question_id UUID,
  p_answer_index INT
) RETURNS JSON AS $$
DECLARE
  v_question RECORD;
  v_session RECORD;
  v_is_correct BOOLEAN;
  v_points_earned INT;
  v_answer RECORD;
  v_existing_answer RECORD;
BEGIN
  -- Check if answer already exists
  SELECT * INTO v_existing_answer
  FROM answers
  WHERE participant_id = p_participant_id AND question_id = p_question_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Jawaban sudah terkirim.',
      'code', 'DUPLICATE'
    );
  END IF;

  -- Get question and validate
  SELECT id, correct_index, points, session_id 
  INTO v_question
  FROM questions
  WHERE id = p_question_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Pertanyaan tidak ditemukan',
      'code', 'QUESTION_NOT_FOUND'
    );
  END IF;
  
  -- Validate session matches
  IF v_question.session_id != p_session_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Sesi tidak valid',
      'code', 'INVALID_SESSION'
    );
  END IF;
  
  -- Check if session is still active
  SELECT id, ended_at INTO v_session
  FROM sessions
  WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Sesi tidak ditemukan',
      'code', 'SESSION_NOT_FOUND'
    );
  END IF;
  
  IF v_session.ended_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Sesi sudah selesai',
      'code', 'SESSION_ENDED'
    );
  END IF;
  
  -- Calculate score
  v_is_correct := p_answer_index = v_question.correct_index;
  v_points_earned := CASE WHEN v_is_correct THEN COALESCE(v_question.points, 100) ELSE 0 END;
  
  -- Insert answer
  INSERT INTO answers (
    session_id,
    participant_id,
    question_id,
    answer_index,
    is_correct,
    points_earned
  ) VALUES (
    p_session_id,
    p_participant_id,
    p_question_id,
    p_answer_index,
    v_is_correct,
    v_points_earned
  )
  RETURNING * INTO v_answer;
  
  RETURN json_build_object(
    'success', true,
    'answer', json_build_object(
      'id', v_answer.id,
      'is_correct', v_answer.is_correct,
      'points_earned', v_answer.points_earned
    )
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Jawaban sudah terkirim.',
      'code', 'DUPLICATE'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'UNKNOWN_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION submit_answer TO anon;
GRANT EXECUTE ON FUNCTION submit_answer TO authenticated;

