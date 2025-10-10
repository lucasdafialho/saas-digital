-- Tabela de auditoria de segurança
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  email TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  details JSONB,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_email ON security_audit_log(email);
CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_severity ON security_audit_log(severity);
CREATE INDEX idx_security_audit_ip ON security_audit_log(ip_address);

-- RLS (Row Level Security) - apenas admins podem ler
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Apenas service role pode inserir
CREATE POLICY "Service role pode inserir" ON security_audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Política: Apenas service role pode ler
CREATE POLICY "Service role pode ler" ON security_audit_log
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Comentários
COMMENT ON TABLE security_audit_log IS 'Log de eventos de segurança do sistema';
COMMENT ON COLUMN security_audit_log.event_type IS 'Tipo de evento: login, failed_login, password_change, etc';
COMMENT ON COLUMN security_audit_log.severity IS 'Severidade: low, medium, high, critical';
