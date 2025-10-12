-- Initialize Team Conversations
-- Run this script once to create chat rooms for all existing teams

SELECT initialize_team_conversations();

-- Verify team conversations were created
SELECT 
  c.id,
  c.name as conversation_name,
  c.type,
  t.name as team_name,
  COUNT(cp.user_id) as participant_count
FROM chat_conversations c
LEFT JOIN teams t ON c.team_id = t.id
LEFT JOIN chat_participants cp ON cp.conversation_id = c.id
WHERE c.type = 'team'
GROUP BY c.id, c.name, c.type, t.name
ORDER BY t.name;
