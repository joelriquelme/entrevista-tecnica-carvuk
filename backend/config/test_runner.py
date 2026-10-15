from django.test.runner import DiscoverRunner
from django.test.utils import override_settings


class IsolatedTestRunner(DiscoverRunner):
    """Run the suite with external integrations off, whatever the local .env says.

    Tests that need Clerk or the SII mock enable them explicitly with override_settings.
    """

    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        self._isolated = override_settings(
            AUTH_ENABLED=False,
            CLERK_PUBLISHABLE_KEY='',
            CLERK_JWKS_URL='',
            SII_API_URL='',
            PUBLIC_BASE_URL='',
            SII_WEBHOOK_TOKEN='',
        )
        self._isolated.enable()

    def teardown_test_environment(self, **kwargs):
        self._isolated.disable()
        super().teardown_test_environment(**kwargs)
