import requests
import sys
from datetime import datetime
import json

class RenewalAPITester:
    def __init__(self, base_url="https://rent-calculator-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {json.dumps(response_data, indent=2)}")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error Response: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Error Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "api/", 200)

    def test_renewal_submit_valid(self):
        """Test renewal submission with valid data"""
        valid_data = {
            "tenant_email": "test@example.com",
            "tenant_name": "John Doe",
            "current_rent": 60000,
            "escalation_percent": 8.0,
            "lockin_months": 6,
            "lockin_label": "6 months",
            "discount_percent": 30,
            "new_monthly_rent": 63360,
            "total_savings": 14400
        }
        return self.run_test("Valid Renewal Submit", "POST", "api/renewal/submit", 200, valid_data)

    def test_renewal_submit_invalid_email(self):
        """Test renewal submission with invalid email"""
        invalid_data = {
            "tenant_email": "invalid-email",
            "tenant_name": "John Doe",
            "current_rent": 60000,
            "escalation_percent": 8.0,
            "lockin_months": 6,
            "lockin_label": "6 months",
            "discount_percent": 30,
            "new_monthly_rent": 63360,
            "total_savings": 14400
        }
        return self.run_test("Invalid Email Submit", "POST", "api/renewal/submit", 422, invalid_data)

    def test_renewal_submit_missing_fields(self):
        """Test renewal submission with missing required fields"""
        incomplete_data = {
            "tenant_email": "test@example.com",
            # Missing other required fields
        }
        return self.run_test("Missing Fields Submit", "POST", "api/renewal/submit", 422, incomplete_data)

    def test_renewal_submit_no_lockin(self):
        """Test renewal submission with no lock-in option"""
        no_lockin_data = {
            "tenant_email": "test@example.com",
            "tenant_name": "Jane Doe",
            "current_rent": 50000,
            "escalation_percent": 10.0,
            "lockin_months": 0,
            "lockin_label": "No lock-in",
            "discount_percent": 0,
            "new_monthly_rent": 55000,
            "total_savings": 0
        }
        return self.run_test("No Lock-in Submit", "POST", "api/renewal/submit", 200, no_lockin_data)

def main():
    print("🚀 Starting Renewal API Tests...")
    print("=" * 50)
    
    tester = RenewalAPITester()
    
    # Test basic connectivity
    tester.test_root_endpoint()
    
    # Test renewal submission scenarios
    tester.test_renewal_submit_valid()
    tester.test_renewal_submit_invalid_email()
    tester.test_renewal_submit_missing_fields()
    tester.test_renewal_submit_no_lockin()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())