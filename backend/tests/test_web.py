import pytest
from fastapi.testclient import TestClient

from accountable.main import create_app


@pytest.fixture
def web_client(tmp_path):
    """A client for an app serving a built frontend from a temporary folder."""
    (tmp_path / "dist" / "assets").mkdir(parents=True)
    (tmp_path / "dist" / "index.html").write_text("<p>the app</p>")
    (tmp_path / "dist" / "assets" / "app.js").write_text("console.log(1)")
    return TestClient(create_app(frontend=tmp_path / "dist"))


@pytest.mark.parametrize("path", ["/", "/deals/12"])
def test_pages_serve_index(web_client, path):
    response = web_client.get(path)
    assert response.status_code == 200
    assert response.text == "<p>the app</p>"


def test_a_file_is_served_as_itself(web_client):
    response = web_client.get("/assets/app.js")
    assert response.text == "console.log(1)"
    assert "javascript" in response.headers["content-type"]


def test_unknown_api_address_is_a_json_404(web_client):
    response = web_client.get("/api/nothing")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}


def test_no_build_serves_no_pages(tmp_path):
    client = TestClient(create_app(frontend=tmp_path / "missing"))
    assert client.get("/").status_code == 404
