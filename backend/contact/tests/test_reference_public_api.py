from rest_framework import status
from rest_framework.test import APITestCase
from django.core.cache import cache

from contact.models import Reference
from contact.reference_cache import bump_public_references_cache_version


class ReferencePublicApiTests(APITestCase):
    def setUp(self):
        super().setUp()
        cache.clear()

    def test_public_reference_list(self):
        Reference.objects.create(
            reference="Ref A",
            image="references/a.webp",
            icon="https://example.test/icon-a.png",
            situation="Situation A",
            tasks=["T1"],
            actions=["A1"],
            results=["R1"],
        )
        Reference.objects.create(
            reference="Ref B",
            image="references/b.webp",
            icon="",
            situation="Situation B",
            tasks=["T2"],
            actions=["A2"],
            results=["R2"],
        )

        res = self.client.get("/api/contact/references")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        self.assertTrue(res.data[0]["image"].startswith("http://testserver/media/"))

    def test_reference_requires_auth(self):
        res = self.client.get("/api/contact/references/admin")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_public_reference_list_uses_cache_and_supports_invalidation(self):
        Reference.objects.create(
            reference="Cached Ref",
            image="references/cached.webp",
            icon="",
            situation="Cached",
            tasks=[],
            actions=[],
            results=[],
        )

        first = self.client.get("/api/contact/references")
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(len(first.data), 1)

        Reference.objects.all().delete()
        second = self.client.get("/api/contact/references")
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(len(second.data), 1)

        bump_public_references_cache_version()
        third = self.client.get("/api/contact/references")
        self.assertEqual(third.status_code, status.HTTP_200_OK)
        self.assertEqual(len(third.data), 0)
