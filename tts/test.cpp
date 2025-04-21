#include <iostream>

using namespace std;

class f {
private:
    int MyInt1; // Private: Only accessible inside class f

public:
    float MyFloat1;
    int MyInt2;

    // Constructor to initialize values
    f() {
        MyInt1 = 10;
        MyFloat1 = 12.5;
        MyInt2 = 12;
        cout << "Good Morning" << endl;
    }

    // Destructor
    ~f() {
        cout << "Object Destroyed" << endl;
    }
};

int main() {
    f obj; // Object of class f is created

    // Accessing public members
    cout << "MyFloat1 = " << obj.MyFloat1 << endl;
    cout << "MyInt2 = " << obj.MyInt2 << endl;

    return 0;
}
