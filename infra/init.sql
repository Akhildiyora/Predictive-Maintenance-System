CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    location VARCHAR(100),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'offline'
);

CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id),
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy devices
INSERT INTO devices (id, name, type, location, status) VALUES 
('machine-001', 'CNC Lathe Alpha', 'CNC_LATHE', 'Floor A', 'online'),
('machine-002', 'Welding Robot Beta', 'ROBOTIC_ARM', 'Floor B', 'online'),
('machine-003', 'Hydraulic Press Gamma', 'HYDRAULIC_PRESS', 'Floor C', 'online')
ON CONFLICT (id) DO UPDATE SET status = 'online';
