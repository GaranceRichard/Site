from rest_framework import status
from rest_framework.test import APITestCase

from contact.models import Reference


class ReferencePublicApiTests(APITestCase):
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
