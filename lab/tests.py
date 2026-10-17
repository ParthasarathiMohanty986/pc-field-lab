from django.test import SimpleTestCase
from django.contrib.staticfiles import finders

class DashboardTests(SimpleTestCase):
    def test_dashboard_and_assets(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'PC FIELD LAB')
        self.assertContains(response, 'id="reset"')
        self.assertContains(response, 'id="download"')
        for name in ['lab/app.js', 'lab/readiness.js', 'lab/style.css']:
            self.assertIsNotNone(finders.find(name))

    def test_no_upload_endpoint(self):
        self.assertEqual(self.client.post('/api/reports/', data={}).status_code, 404)
