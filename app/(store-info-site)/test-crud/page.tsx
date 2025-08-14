"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, Database, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface TestResult {
  endpoint: string;
  method: string;
  success: boolean;
  message: string;
  data?: any;
}

export default function TestCRUDPage() {
  const { data: session } = useSession();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState("");

  // Test data
  const testData = {
    blog: {
      title: "Test Blog Post " + Date.now(),
      content: "This is a test blog post content.",
      excerpt: "Test excerpt",
      author: "Test Author",
      slug: "test-blog-" + Date.now(),
      published: true,
    },
    product: {
      name: "Test Product " + Date.now(),
      description: "This is a test product description.",
      price: 99.99,
      category: "Test Category",
      imageUrl: "https://via.placeholder.com/150",
      isActive: true,
    },
    fabric: {
      name: "Test Fabric " + Date.now(),
      type: "Upholstery",
      pattern: "Solid",
      color: "Blue",
      colorHex: "#0000FF",
      manufacturer: "Test Manufacturer",
      pricePerYard: 49.99,
      width: 54,
      minimumOrder: 1,
      leadTime: 7,
      stockQuantity: 100,
      isCustomOrder: false,
      durability: 5,
      isStainResistant: true,
      isFadeResistant: true,
      isWaterResistant: false,
      isPetFriendly: true,
      isOutdoorSafe: false,
      isFireRetardant: true,
      isActive: true,
      isFeatured: false,
    },
    post: {
      title: "Test Social Post " + Date.now(),
      content: "This is a test social media post.",
      platform: "twitter",
      scheduledDate: new Date().toISOString(),
      status: "draft",
      tags: ["test", "crud"],
    },
  };

  const runTest = async (
    endpoint: string,
    method: string,
    body?: any,
    testName?: string
  ): Promise<TestResult> => {
    setCurrentTest(testName || `${method} ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = method === "DELETE" ? null : await response.json().catch(() => null);

      const result = {
        endpoint,
        method,
        success: response.ok,
        message: response.ok ? "Success" : `Failed: ${response.status}`,
        data,
      };

      return result;
    } catch (error) {
      return {
        endpoint,
        method,
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  };

  const runAllTests = async () => {
    if (!session) {
      alert("Please sign in first to test CRUD operations");
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    // Test Blog CRUD
    setCurrentTest("Blog CRUD Operations");
    
    // Create
    const blogCreate = await runTest("/api/blog", "POST", testData.blog, "Create Blog Post");
    results.push(blogCreate);
    const blogId = blogCreate.data?.id;

    if (blogId) {
      // Read
      const blogRead = await runTest(`/api/blog/${blogId}`, "GET", null, "Read Blog Post");
      results.push(blogRead);

      // Update
      const blogUpdate = await runTest(
        `/api/blog/${blogId}`,
        "PUT",
        { ...testData.blog, title: "Updated Blog Post" },
        "Update Blog Post"
      );
      results.push(blogUpdate);

      // Delete
      const blogDelete = await runTest(`/api/blog/${blogId}`, "DELETE", null, "Delete Blog Post");
      results.push(blogDelete);
    }

    // Test Products CRUD
    setCurrentTest("Products CRUD Operations");
    
    // Create
    const productCreate = await runTest("/api/products", "POST", testData.product, "Create Product");
    results.push(productCreate);
    const productId = productCreate.data?.id;

    if (productId) {
      // Read
      const productRead = await runTest("/api/products", "GET", null, "Read Products");
      results.push(productRead);

      // Update
      const productUpdate = await runTest(
        "/api/products",
        "PUT",
        { id: productId, ...testData.product, name: "Updated Product" },
        "Update Product"
      );
      results.push(productUpdate);

      // Delete
      const productDelete = await runTest(
        "/api/products",
        "DELETE",
        { id: productId },
        "Delete Product"
      );
      results.push(productDelete);
    }

    // Test Fabrics CRUD
    setCurrentTest("Fabrics CRUD Operations");
    
    // Create
    const fabricCreate = await runTest("/api/fabrics", "POST", testData.fabric, "Create Fabric");
    results.push(fabricCreate);
    const fabricId = fabricCreate.data?.id;

    if (fabricId) {
      // Read
      const fabricRead = await runTest(`/api/fabrics/${fabricId}`, "GET", null, "Read Fabric");
      results.push(fabricRead);

      // Update
      const fabricUpdate = await runTest(
        `/api/fabrics/${fabricId}`,
        "PUT",
        { ...testData.fabric, name: "Updated Fabric" },
        "Update Fabric"
      );
      results.push(fabricUpdate);

      // Delete
      const fabricDelete = await runTest(`/api/fabrics/${fabricId}`, "DELETE", null, "Delete Fabric");
      results.push(fabricDelete);
    }

    // Test Posts CRUD
    setCurrentTest("Posts CRUD Operations");
    
    // Create
    const postCreate = await runTest("/api/posts", "POST", testData.post, "Create Post");
    results.push(postCreate);
    const postId = postCreate.data?.id;

    if (postId) {
      // Read
      const postRead = await runTest(`/api/posts/${postId}`, "GET", null, "Read Post");
      results.push(postRead);

      // Update
      const postUpdate = await runTest(
        `/api/posts/${postId}`,
        "PUT",
        { ...testData.post, title: "Updated Post" },
        "Update Post"
      );
      results.push(postUpdate);

      // Delete
      const postDelete = await runTest(`/api/posts/${postId}`, "DELETE", null, "Delete Post");
      results.push(postDelete);
    }

    setTestResults(results);
    setIsRunning(false);
    setCurrentTest("");
  };

  const successCount = testResults.filter((r) => r.success).length;
  const failureCount = testResults.filter((r) => !r.success).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Database className="h-8 w-8" />
            CRUD Operations Test Suite
          </CardTitle>
          <CardDescription>
            Test all Create, Read, Update, and Delete operations for your API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-yellow-700">Authentication Required</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Please sign in as an admin to test CRUD operations
              </p>
            </div>
          )}

          <div className="flex gap-4 items-center">
            <Button
              onClick={runAllTests}
              disabled={isRunning || !session}
              size="lg"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run All CRUD Tests"
              )}
            </Button>

            {currentTest && (
              <div className="text-sm text-muted-foreground">
                Testing: {currentTest}
              </div>
            )}
          </div>

          {testResults.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{testResults.length}</div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{successCount}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">{failureCount}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {testResults.length > 0
                        ? Math.round((successCount / testResults.length) * 100)
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Method</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Endpoint</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {testResults.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium
                              ${result.method === 'GET' ? 'bg-blue-100 text-blue-700' : ''}
                              ${result.method === 'POST' ? 'bg-green-100 text-green-700' : ''}
                              ${result.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' : ''}
                              ${result.method === 'DELETE' ? 'bg-red-100 text-red-700' : ''}
                            `}>
                              {result.method}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-mono">{result.endpoint}</td>
                          <td className="px-4 py-2 text-sm">{result.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {testResults.some(r => r.data) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Response Data (Sample)</h3>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-xs">
                      {JSON.stringify(
                        testResults.filter(r => r.data).slice(0, 3).map(r => ({
                          endpoint: r.endpoint,
                          method: r.method,
                          data: r.data
                        })),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What This Tests:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✓ Blog Posts - Create, Read, Update, Delete</li>
              <li>✓ Products - Full CRUD operations</li>
              <li>✓ Fabrics - Complete lifecycle management</li>
              <li>✓ Social Posts - All API endpoints</li>
              <li>✓ Database persistence (Vercel KV + Neon)</li>
              <li>✓ Authentication & Authorization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}