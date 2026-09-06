import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_auth_default_seed_user():
    # Test logging in with the default admin credentials
    res = client.post("/v1/auth/login", json={
        "email": "admin@telemetria.ai",
        "password": "telemetria2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@telemetria.ai"
    assert data["user"]["is_paid"] is True
    assert "Pro" in data["user"]["plan"]
    assert data["user"]["plan_credits"] == 100.0


def test_auth_register_and_login_flow():
    test_email = "team_lead@vrahad.ai"
    test_password = "SecurePassword2026!"

    # 1. Register
    reg_res = client.post("/v1/auth/register", json={
        "email": test_email,
        "password": test_password,
        "name": "Team Lead",
        "org_name": "vrahad"
    })
    # If already created in prior run, 201 or 400
    if reg_res.status_code == 201:
        assert reg_res.json()["user"]["is_paid"] is True

    # 2. Login
    login_res = client.post("/v1/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["user"]["email"] == test_email
    assert data["user"]["is_paid"] is True


def test_auth_invalid_password():
    res = client.post("/v1/auth/login", json={
        "email": "admin@telemetria.ai",
        "password": "wrongpassword123"
    })
    assert res.status_code == 401
