from django.http import JsonResponse, HttpResponse

# Create your views here.
def registrar_dashboard(request, reg_id):
    if request.method == "OPTIONS":
        response = JsonResponse({"message": "CORS preflight successful"})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST,GET,OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        print(response)
        return response
    else:
        return JsonResponse({"user_id": reg_id}, status=200)