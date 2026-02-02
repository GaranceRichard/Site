from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class ContactMessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "limit"
    max_page_size = 200
    page_query_param = "page"

    def get_page_number(self, request, paginator):
        raw = request.query_params.get(self.page_query_param, 1)
        if raw in self.last_page_strings:
            return paginator.num_pages
        try:
            page = int(raw)
        except (TypeError, ValueError):
            return 1
        return page if page > 0 else 1

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "page": self.page.number,
                "limit": self.get_page_size(self.request),
                "results": data,
            }
        )
