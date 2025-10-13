'use client';

import { useState } from 'react';
import {
  Button,
  Spinner,
  SpinnerOverlay,
  SpinnerInline,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  LoadingState,
  Card,
  CardContent
} from '@/components/ui';

export default function LoadingDemoPage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const handleOverlayClick = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-2">Loading States Demo</h1>
        <p className="text-gray-600 mb-8">
          Comprehensive showcase of all loading state components and patterns
        </p>

        {/* Button Loading States */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Button Loading States</h2>
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button loading={buttonLoading} onClick={handleButtonClick}>
                  Primary Button
                </Button>
                <Button variant="secondary" loading={buttonLoading} onClick={handleButtonClick}>
                  Secondary Button
                </Button>
                <Button variant="success" loading={buttonLoading} onClick={handleButtonClick}>
                  Success Button
                </Button>
                <Button variant="danger" loading={buttonLoading} onClick={handleButtonClick}>
                  Danger Button
                </Button>
                <Button variant="outline" loading={buttonLoading} onClick={handleButtonClick}>
                  Outline Button
                </Button>
                <Button variant="ghost" loading={buttonLoading} onClick={handleButtonClick}>
                  Ghost Button
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Button size="sm" loading={buttonLoading} onClick={handleButtonClick}>
                  Small
                </Button>
                <Button size="md" loading={buttonLoading} onClick={handleButtonClick}>
                  Medium
                </Button>
                <Button size="lg" loading={buttonLoading} onClick={handleButtonClick}>
                  Large
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Spinner Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Spinner Components</h2>
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sizes</h3>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <Spinner size="sm" />
                      <p className="text-xs text-gray-600 mt-2">Small</p>
                    </div>
                    <div className="text-center">
                      <Spinner size="md" />
                      <p className="text-xs text-gray-600 mt-2">Medium</p>
                    </div>
                    <div className="text-center">
                      <Spinner size="lg" />
                      <p className="text-xs text-gray-600 mt-2">Large</p>
                    </div>
                    <div className="text-center">
                      <Spinner size="xl" />
                      <p className="text-xs text-gray-600 mt-2">Extra Large</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Colors</h3>
                  <div className="flex items-center space-x-6">
                    <Spinner color="primary" />
                    <Spinner color="success" />
                    <Spinner color="danger" />
                    <Spinner color="gray" />
                    <div className="bg-gray-800 p-4 rounded">
                      <Spinner color="white" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Inline Spinner</h3>
                  <SpinnerInline message="Loading data..." />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Overlay Spinner</h3>
                  <Button onClick={handleOverlayClick}>Show Overlay</Button>
                  {showOverlay && <SpinnerOverlay message="Processing your request..." />}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Skeleton Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Skeleton Loading</h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Basic Skeleton</h3>
                <div className="space-y-4">
                  <Skeleton variant="text" />
                  <Skeleton variant="rectangular" height={100} />
                  <Skeleton variant="rounded" height={60} />
                  <Skeleton variant="circular" width={60} height={60} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Skeleton Text</h3>
                <SkeletonText lines={5} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Skeleton Table</h3>
                <SkeletonTable rows={5} columns={4} />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Skeleton Form</h3>
                <SkeletonForm fields={5} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Loading State Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">LoadingState Component</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Spinner Type</h3>
                <LoadingState type="spinner" message="Loading content..." />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Card Type</h3>
                <LoadingState type="card" />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Table Type</h3>
                <LoadingState type="table" rows={3} columns={3} />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Form Type</h3>
                <LoadingState type="form" fields={3} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Real-world Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Real-world Examples</h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Loading Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3">
                        <Skeleton variant="circular" width={48} height={48} />
                        <div className="flex-1">
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" className="mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <SkeletonTable rows={4} columns={5} />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Loading Deal Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="flex justify-between mb-3">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="20%" />
                      </div>
                      <SkeletonText lines={3} />
                      <div className="mt-4 space-y-2">
                        <Skeleton variant="rounded" height={36} />
                        <div className="grid grid-cols-2 gap-2">
                          <Skeleton variant="rounded" height={32} />
                          <Skeleton variant="rounded" height={32} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
