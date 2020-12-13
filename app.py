from flask import Flask, render_template, url_for, request, jsonify
from requests.auth import HTTPBasicAuth
import requests
import json
import base64
import config

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data', methods=['POST'])
def handle_data():
    if request.method == "POST":
        longitude = request.form.get('longitude')
        latitude = request.form.get('latitude')
        radius = request.form.get('range')

        base64_email_bytes = config.email.encode('ascii')
        email_bytes = base64.b64decode(base64_email_bytes)
        email = email_bytes.decode('ascii')

        base64_password_bytes = config.password.encode('ascii')
        password_bytes = base64.b64decode(base64_password_bytes)
        password = password_bytes.decode('ascii')

        base64_apikey_bytes = config.apikey.encode('ascii')
        apikey_bytes = base64.b64decode(base64_apikey_bytes)
        apikey = apikey_bytes.decode('ascii')

        try:
            zipcode_r = requests.get(f'http://nominatim.openstreetmap.org/reverse?format=json&lon={longitude}&lat={latitude}').json()
            zipcode = zipcode_r['address']['postcode']
        except Exception:
            return "Error fetching zipcode"

        try:
            endpoint = f"https://service.zipapi.us/hospital/radius/{zipcode}?X-API-KEY={apikey}&radius={radius}"
            hospital_data = requests.get(endpoint, auth=HTTPBasicAuth(email, password))
            hospital_data = json.loads(hospital_data.text)['data']
            hospitals = []
            for hospital in hospital_data:

                name = hospital['Name'].title()
                website = hospital['website']
                # address = f"{hospital['Address'].title()}, {hospital['City']}, {hospital['county']}, {hospital['State']} {hospital['Zip']}"
                address = f"{hospital['Address'].title()}, {hospital['City']} {hospital['Zip']}"
                
                longitude = hospital['longitude']
                latitude = hospital['latitude']
                distance = float(hospital['distance'])/0.62137
                distance = f"{distance:.3f}"

                beds = int(hospital['beds'])
                beds = 0 if beds == -999 else beds

                telephone = hospital['telephone']

                row = {'name':name, 'website':website, 'address':address, 'longitude':longitude, 'latitude':latitude, 'distance':distance, 'beds':beds, 'telephone':telephone}
                hospitals.append(row)

        except Exception:
            return 'Error fetching hospital data'   

        res = memoized_bst(hospitals)
        return jsonify(res)

def memoized_bst(data):
    print(data)
    max = 0
    h = data[0]
    for item in data:
        beds = item['beds']
        if beds > max:
            max = beds
            h = item
    print(h['beds'])
    return h

if __name__ == '__main__':
    app.run(debug=True)
